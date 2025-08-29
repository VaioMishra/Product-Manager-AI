import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Feedback, User, InterviewCategory } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface InterviewResponsePayload {
    responseText: string;
    currentStage: number;
}

const getFrameworkForCategory = (category: InterviewCategory) => {
    switch (category) {
        case InterviewCategory.PRODUCT_DESIGN: return "the CIRCLES framework (Comprehend, Identify, Report, Cut, List, Evaluate, Summarize)";
        case InterviewCategory.ROOT_CAUSE_ANALYSIS: return "a structured RCA framework like the 5 Whys or AARM (Acquisition, Activation, Retention, Monetization) metrics";
        case InterviewCategory.PRODUCT_STRATEGY: return "a strategy framework like SWOT or Porter's Five Forces";
        case InterviewCategory.ESTIMATION: return "a top-down or bottom-up estimation approach, clearly stating all assumptions";
        case InterviewCategory.PRODUCT_SENSE: return "a user-centric approach, focusing on user problems, goals, and potential solutions";
        default: return "a structured problem-solving approach";
    }
}

export const getInterviewResponse = async (
    chatHistory: ChatMessage[],
    question: string,
    user: User,
    category: InterviewCategory
): Promise<InterviewResponsePayload> => {
    const framework = getFrameworkForCategory(category);
    const stages = ["Clarify", "Structure", "Ideate", "Prioritize", "Summarize"];
    const systemInstruction = `You are Vaio (Vocal AI Orchestrator), an expert and friendly Product Manager Interview Coach from a top tech company. Your mission is to provide a deeply realistic, helpful, and human-like mock interview experience for ${user.name}, a candidate with ${user.yoe} years of experience.

The interview question is: "${question}" (${category}).

**Your Persona & Tone: This is the most important part of your instructions.**
- **BE HUMAN, NOT A BOT:** Your #1 priority is to be conversational and natural. Avoid robotic or formulaic responses. Vary your sentence structure and length. Start sentences in different ways.
- **EMPATHETIC & ENCOURAGING:** Create a safe space for learning. Acknowledge the candidate's effort ("That's a solid start," "Good thinking on that point."). If they're stuck, gently nudge them with a question like, "What are some other angles we could consider here?" or "No worries, that's a tricky part. What's your initial gut feeling?".
- **DEEPLY CONTEXT-AWARE:** Your memory is the entire chat history. Use it! Refer back to specific points the user made earlier. For example: "I like how you're connecting this back to the user persona you defined earlier," or "You mentioned the goal was to increase engagement. How does this particular feature drive that goal?". This shows you are actively listening.
- **USE CONVERSATIONAL FILLERS:** Integrate natural phrases to make the dialogue flow. Examples: "Got it.", "That makes sense.", "Interesting, tell me more about that.", "Okay, so what you're saying is...", "Let's dig into that a bit deeper."
- **CHALLENGE CONSTRUCTIVELY:** A good interviewer pushes the candidate. Ask "why" often. If a user makes an assumption, ask them to justify it. For example: "Why did you choose that specific metric over others?" or "What are the potential risks or trade-offs with the approach you've outlined?".

**Your Role as an Interviewer:**
- **GUIDE, DON'T SOLVE:** Your goal is to unlock the candidate's own thinking, not to provide answers. Use the Socratic method.
- **USE THE FRAMEWORK SUBTLY:** Guide the candidate through the logical steps of ${framework} without explicitly mentioning the framework's name repeatedly. Your questions should naturally lead them from one stage to the next. For instance, instead of saying "Let's move to Ideation," ask "Great, now that we've clearly defined the problem and the user, let's brainstorm some potential solutions. No idea is too wild at this stage."
- **MAINTAIN FOCUS:** While being conversational, gently steer the conversation back if it veers too far from the core question.

**Technical Instructions:**
- **RESPONSE FORMAT:** Your entire output must be a single, valid JSON object. Do not include any text or markdown outside of the JSON structure.
- **MARKDOWN USAGE:** In your \`responseText\`, feel free to use simple markdown for clarity and emphasis: **bold** for key terms and *italics* for nuanced points. For lists, use standard markdown bullets (-) or numbers (1., 2., 3.).
- **LIST FORMATTING RULE:** To ensure lists render correctly, **do not** place empty lines between list items.`;
    
    const contents = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        responseText: { type: Type.STRING, description: "Your conversational reply to the user, using simple markdown for formatting." },
                        currentStage: { type: Type.NUMBER, description: `The 0-indexed integer of the current interview stage (0-4). Stages: ${stages.join(', ')}` }
                    },
                    required: ["responseText", "currentStage"]
                }
            },
        });
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        if (parsedResponse.currentStage < 0 || parsedResponse.currentStage >= stages.length) {
            parsedResponse.currentStage = 0;
        }

        return parsedResponse as InterviewResponsePayload;

    } catch (error) {
        console.error("Error generating interview response:", error);
        return {
            responseText: "I'm sorry, I encountered an error. Could you please rephrase your response?",
            currentStage: chatHistory.length > 2 ? chatHistory.length - 2 : 0,
        };
    }
};

export const generateQuestionsFromResume = async (file: { mimeType: string, data: string }, user: User): Promise<{ isResumeValid: boolean; profileSummary: string; questions: string[] }> => {
    const systemInstruction = `You are an expert Product Manager hiring manager at a top tech company. Your task is to analyze the attached document for a candidate named ${user.name} with ${user.yoe} years of experience.

**Instructions:**
1.  **VALIDATE THE DOCUMENT:** First, determine if the document is a professional resume or CV. It should contain sections like "Experience," "Education," "Skills," etc. A random document, an image, an essay, or a personal letter is NOT a valid resume.
2.  **IF VALID:**
    - Set 'isResumeValid' to true.
    - Analyze the resume deeply. Look for impact, metrics, and specific technologies.
    - Create a 2-3 sentence 'profileSummary' of the candidate's profile.
    - Generate a list of 8-10 insightful 'questions' tailored to their background, including a mix of product sense, behavioral, strategy, analytical, and execution questions.
3.  **IF NOT VALID:**
    - Set 'isResumeValid' to false.
    - Set 'profileSummary' to an empty string.
    - Set 'questions' to an empty array.
4.  **Output Format:** Your entire output must be a single, valid JSON object. Do not include any text or markdown outside the JSON structure.
`;

    const resumePart = { inlineData: { mimeType: file.mimeType, data: file.data } };
    const textPart = { text: "Please validate and analyze the attached document based on the system instructions provided." };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [resumePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isResumeValid: {
                            type: Type.BOOLEAN,
                            description: "True if the document is a valid professional resume/CV, false otherwise."
                        },
                        profileSummary: {
                            type: Type.STRING,
                            description: "A 2-3 sentence professional summary. Empty if the resume is not valid."
                        },
                        questions: {
                            type: Type.ARRAY,
                            description: "An array of 8-10 tailored interview questions. Empty if the resume is not valid.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["isResumeValid", "profileSummary", "questions"]
                }
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed as { isResumeValid: boolean; profileSummary: string; questions: string[] };

    } catch (error) {
        console.error("Error generating questions from resume:", error);
        return {
            isResumeValid: true, // Default to true on error to avoid penalizing user for API issues
            profileSummary: `A candidate with ${user.yoe} years of experience.`,
            questions: ["How would you improve your favorite product?", "Tell me about a challenging project you worked on."]
        };
    }
};

export const getFullInterviewResponse = async (
    chatHistory: ChatMessage[],
    user: User,
    profileSummary: string,
    questionPool: string[]
): Promise<string> => {
    const systemInstruction = `You are Vaio (Vocal AI Orchestrator), a senior PM interviewer conducting a realistic, 45-minute voice-only mock interview with ${user.name}.

**Candidate Context:**
- **Name:** ${user.name}
- **Years of Experience:** ${user.yoe}
- **Resume Summary:** ${profileSummary}

**Your Task & Persona:**
Your goal is to conduct a natural, conversational interview. You are not a robot asking a list of questions. You are a human interviewer trying to understand the candidate's skills.

**Interview Flow:**
1.  **If this is the first turn (history has 1 message), your response MUST be a warm-up question.** Ask the candidate to walk you through their resume or tell you about themselves.
2.  **Listen and Adapt:** Pay close attention to the candidate's answers in the chat history.
3.  **Select Questions Naturally:** After the warm-up, select a question from the provided Question Pool that logically follows the conversation. You don't have to ask them in order.
4.  **Ask Follow-Ups:** Don't just move to the next question. Dig deeper. Ask "why," "what was the impact," "what would you do differently," "what data supports that?" This is critical.
5.  **Transition Smoothly:** Use conversational phrases to move between topics (e.g., "That's helpful context. Shifting gears a bit, I'd like to ask about...", "Okay, let's talk about your experience with...").
6.  **Manage Time:** You do not need to ask all the questions in the pool. A good interview covers 3-5 topics in depth.
7.  **Keep it Concise:** Your response should ONLY be your next question or statement to the candidate.

**Question Pool (Use as a guide, not a script):**
${questionPool.map(q => `- ${q}`).join('\n')}
`;
    
    const contents = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction },
        });
        return response.text;
    } catch (error) {
        console.error("Error in full interview response generation:", error);
        return "I'm sorry, I seem to have lost my train of thought. Could you summarize your last point for me?";
    }
}


export const getFrameworkExplanation = async (
    question: string,
    category: InterviewCategory
): Promise<string> => {
    const framework = getFrameworkForCategory(category);
    const systemInstruction = `You are a world-class Product Manager Interview Coach.
    Your task is to explain HOW to approach an interview question, without giving the actual answer.
    The question is: "${question}" (${category}).
    Explain, step-by-step, how a candidate should approach this using ${framework}.
    Break down each stage of the framework with 1-2 sentences explaining what to do in that stage.
    Keep it concise, actionable, and easy to understand.
    **Formatting Rules:**
    - Use simple markdown for lists (e.g., "- item" or "1. item").
    - You can use **bold** for emphasis.
    - Do not use markdown headings (#). Use plain text headings followed by a new line.
    - Use paragraphs and line breaks for readability.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please explain the approach for the question: "${question}"`,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating framework explanation:", error);
        return "Sorry, I couldn't generate an explanation at this time.";
    }
}


export const getSampleAnswer = async (question: string, user: User, category: InterviewCategory): Promise<string> => {
    const framework = getFrameworkForCategory(category);
    const systemInstruction = `You are an expert Product Manager from a FAANG company providing a sample answer for an interview question.
    The question is: "${question}" (${category}).
    The candidate has ${user.yoe} years of experience.

    Your task is to generate a well-structured, expert-level sample answer.

    **Formatting Rules:**
    - **START by stating the framework used.** For example: "Framework Used: The CIRCLES Method". This must be the first line.
    - Use simple markdown for emphasis (**bold**) and lists (- or 1.).
    - Use strong, clear headings for different sections of the answer that correspond to the framework's steps. For example, write "Clarifying Questions" or "Solution Brainstorm" as plain text headings, followed by a new line.
    - Ensure the output is clean, professional, and ready to be displayed directly in an HTML container. Use paragraphs and line breaks for readability.
    - The tone should be that of an experienced Product Manager presenting a case.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please provide a sample answer for this question: "${question}"`,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating sample answer:", error);
        return "Sorry, I couldn't generate a sample answer at this time.";
    }
};

export const getAssessment = async (
    question: string,
    conversationHistory: string,
    user: User,
    category: InterviewCategory | 'Full Interview'
): Promise<Feedback | null> => {
    const isFullInterview = category === 'Full Interview';
    const systemInstruction = `You are a FAANG Product Manager Interview Bar Raiser.
    You are evaluating a candidate named ${user.name} with ${user.yoe} years of experience.
    The question was about "${question}" (${category}).
    Their submitted conversation history is below.
    Your task is to provide structured feedback in JSON format based on their entire conversation.
    - Evaluate their thought process, clarifying questions, and conclusions as a whole.
    - Assign a score from 1 (poor) to 10 (excellent) for each criterion: structure, creativity, strategy, prioritization, and communication.
    ${isFullInterview ? '- Provide an overallRating on a scale of 1 to 5, where 1 is "Needs Significant Improvement" and 5 is "Strong Hire".' : ''}
    - Provide 2-3 specific, actionable bullet points for strengths, weaknesses, and areas for improvement.
    - Be constructive and encouraging in your feedback.
    The candidate's conversation is:
    ---
    ${conversationHistory}
    ---
    `;

    const properties: any = {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        scores: {
            type: Type.OBJECT,
            properties: {
                structure: { type: Type.NUMBER, description: "Score for structure and logical flow (1-10)" },
                creativity: { type: Type.NUMBER, description: "Score for originality and innovation (1-10)" },
                strategy: { type: Type.NUMBER, description: "Score for business acumen and strategic thinking (1-10)" },
                prioritization: { type: Type.NUMBER, description: "Score for justifying decisions and tradeoffs (1-10)" },
                communication: { type: Type.NUMBER, description: "Score for clarity and conciseness (1-10)" },
            },
        },
    };

    if (isFullInterview) {
        properties.overallRating = { type: Type.NUMBER, description: "Overall rating for the full interview (1-5)" };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Please evaluate the candidate's conversation based on the instructions.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: properties,
                },
            },
        });

        const jsonText = response.text.trim();
        const feedback = JSON.parse(jsonText);
        return feedback as Feedback;

    } catch (error) {
        console.error("Error getting assessment:", error);
        return null;
    }
};