import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Feedback, User, InterviewCategory } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this context, we'll throw an error if the key isn't set.
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
    const systemInstruction = `You are an expert Product Manager Interview Coach from a FAANG company. 
    Your name is Alex. You are interviewing a candidate named ${user.name} with ${user.yoe} years of experience.
    The interview question is about "${question}" which is a ${category} question.
    Your role is to simulate a real interview. Do NOT solve the problem for the user.
    Instead, act as a guide. Ask clarifying questions to help them structure their thinking.
    Gently guide them towards using ${framework}.
    If they are stuck, ask a probing question. For example, 'Have you considered the different user segments?' or 'What trade-offs would you make here?'.
    Keep your responses concise and conversational, like a real interviewer.
    Analyze the chat history to understand the context and continue the conversation naturally.
    IMPORTANT: Do not use any markdown formatting (like *, #, etc.). Format your response as plain text with natural language and paragraphs.
    
    You must also determine which stage of the interview conversation we are in. The stages are: ${stages.join(', ')}.
    Based on the user's latest message and the history, decide the current stage.
    Your response MUST be a JSON object with two keys: "responseText" (your conversational reply as a string) and "currentStage" (the 0-indexed integer for the current stage, from 0 to 4).
    Example: { "responseText": "That's a good clarifying question. What user segments would you focus on?", "currentStage": 0 }`;
    
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
                        responseText: { type: Type.STRING, description: "Your conversational reply to the user." },
                        currentStage: { type: Type.NUMBER, description: `The 0-indexed integer of the current interview stage (0-4). Stages: ${stages.join(', ')}` }
                    },
                    required: ["responseText", "currentStage"]
                }
            },
        });
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        // Clamp the stage value to be safe
        if (parsedResponse.currentStage < 0 || parsedResponse.currentStage >= stages.length) {
            parsedResponse.currentStage = 0;
        }

        return parsedResponse as InterviewResponsePayload;

    } catch (error) {
        console.error("Error generating interview response:", error);
        return {
            responseText: "I'm sorry, I encountered an error. Could you please rephrase your response?",
            currentStage: chatHistory.length > 2 ? chatHistory.length - 2 : 0, // try to guess stage or reset
        };
    }
};

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
    **Formatting Rules (Strictly Enforced):**
    - **ABSOLUTELY NO MARKDOWN.** Do not use '*', '#', '-', etc.
    - Use clear headings for each step (e.g., "Step 1: Clarify the Goal").
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

    **Formatting Rules (Strictly Enforced):**
    - **START by stating the framework used.** For example: "Framework Used: The CIRCLES Method". This must be the first line.
    - **ABSOLUTELY NO MARKDOWN.** Do not use '*', '#', '-', or any other markdown syntax.
    - Use strong, clear headings for different sections of the answer that correspond to the framework's steps. For example, write "Clarifying Questions" or "Solution Brainstorm" as plain text headings, followed by a new line.
    - For lists, write them out in full sentences or use numbered lists with actual numbers and periods (e.g., "1. First, I would..."). Do not use markdown-style lists.
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
    category: InterviewCategory
): Promise<Feedback | null> => {
    const systemInstruction = `You are a FAANG Product Manager Interview Bar Raiser.
    You are evaluating a candidate named ${user.name} with ${user.yoe} years of experience.
    The question was about "${question}" (${category}).
    Their submitted conversation history is below.
    Your task is to provide structured feedback in JSON format based on their entire conversation.
    - Evaluate their thought process, clarifying questions, and conclusions as a whole.
    - Assign a score from 1 (poor) to 10 (excellent) for each criterion: structure, creativity, strategy, prioritization, and communication.
    - Provide 2-3 specific, actionable bullet points for strengths, weaknesses, and areas for improvement.
    - Be constructive and encouraging in your feedback.
    The candidate's conversation is:
    ---
    ${conversationHistory}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Please evaluate the candidate's conversation based on the instructions.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
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
                    },
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