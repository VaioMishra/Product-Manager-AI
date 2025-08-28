import React, { useState, useRef, useEffect } from 'react';
import { User, InterviewCategory, ChatMessage, Feedback } from '../types';
import { getInterviewResponse, getAssessment } from '../services/geminiService';
import { speechService } from '../services/speechService';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Card from './common/Card';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import ProgressBar from './common/ProgressBar';
import Typewriter from './common/Typewriter';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import Modal from './common/Modal';
import FeedbackDisplay from './FeedbackDisplay';
import HelpGuide from './HelpGuide';

interface PracticeModeProps {
  user: User;
  category: InterviewCategory;
  question: string;
}

// FIX: Added type definitions for the Web Speech API to fix "Cannot find name 'SpeechRecognition'" errors.
// The SpeechRecognition API is not part of the standard TypeScript DOM library, so we need to provide the types.
interface SpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onstart: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

// Extend window type for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

const PracticeMode: React.FC<PracticeModeProps> = ({ user, category, question }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const interviewStages = ["Clarify", "Structure", "Ideate", "Prioritize", "Summarize"];
  const [currentStep, setCurrentStep] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialMessage = `Hi ${user.name}, I'm Alex, your interviewer. Let's discuss the following: "${question}". How would you approach this?`;
    // Start the conversation with the bot's introduction
    setChatHistory([{
      sender: 'bot',
      text: initialMessage
    }]);
    setCurrentStep(0);

    // Cleanup speech synthesis on component unmount
    return () => {
      speechService.cancel();
    };
  }, [user.name, question]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        setUserInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      speechService.cancel();
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    speechService.cancel();
    
    const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: userInput }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);
    
    setChatHistory(prev => [...prev, { sender: 'bot', text: '', isThinking: true }]);

    const botResponsePayload = await getInterviewResponse(newHistory, question, user, category);
    
    setChatHistory(prev => [...prev.slice(0, -1), { sender: 'bot', text: botResponsePayload.responseText }]);
    
    if (chatHistory.length > 1) { // Don't narrate the very first message
        speechService.speak(botResponsePayload.responseText);
    }
    
    setCurrentStep(botResponsePayload.currentStage);
    setIsLoading(false);
  };

  const handleSubmitForFeedback = async () => {
      setIsAssessing(true);
      setIsFeedbackModalOpen(true);
      setFeedback(null);
      
      const conversation = chatHistory
        .map(msg => `${msg.sender === 'user' ? user.name : 'Alex'}: ${msg.text}`)
        .join('\n\n');

      const result = await getAssessment(question, conversation, user, category);
      
      if (result) {
        setFeedback(result);
      } else {
        // Handle error case inside the modal
        setFeedback({
          strengths: [], weaknesses: [], improvements: ["Sorry, an error occurred while generating feedback."],
          scores: { structure: 0, creativity: 0, strategy: 0, prioritization: 0, communication: 0 }
        });
      }
      setIsAssessing(false);
    };


  return (
    <>
      <Card>
        <div className="p-4 h-[75vh] flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
            <ProgressBar steps={interviewStages} currentStep={currentStep} />
            <div className="flex gap-2 flex-shrink-0 ml-4">
                <Button onClick={() => setIsHelpOpen(true)} variant="secondary" size="sm">Help Me</Button>
                <Button onClick={handleSubmitForFeedback} disabled={isAssessing || chatHistory.length < 2} size="sm">
                    {isAssessing ? <Spinner /> : 'Submit for Feedback'}
                </Button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-base-300/10 to-transparent rounded-lg">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center shadow-lg"><BotIcon className="w-5 h-5" /></div>}
                <div className={`max-w-md md:max-w-lg p-3 rounded-lg border text-base leading-relaxed
                  ${msg.sender === 'user' 
                    ? 'bg-brand-primary/80 backdrop-blur-sm border-brand-secondary text-white rounded-br-none shadow-lg' 
                    : 'bg-base-200/50 backdrop-blur-sm border-base-300 text-content-100 rounded-bl-none shadow-lg'}`
                }>
                  {msg.isThinking ? <Spinner /> : 
                   msg.sender === 'bot' ? <Typewriter text={msg.text} /> : <p className="whitespace-pre-wrap">{msg.text}</p>
                  }
                </div>
                {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center shadow-lg"><UserIcon className="w-5 h-5" /></div>}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your response..."}
              className="flex-grow bg-base-200 border border-base-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
              disabled={isLoading}
            />
             {recognitionRef.current && (
                <Button type="button" onClick={handleMicClick} variant="secondary" className="px-3" aria-label="Use microphone">
                    <MicrophoneIcon className={`w-6 h-6 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-content-200'}`} />
                </Button>
            )}
            <Button type="submit" disabled={isLoading || !userInput.trim()}>
              {isLoading ? <Spinner /> : 'Send'}
            </Button>
          </form>
        </div>
      </Card>

      {isHelpOpen && (
        <HelpGuide 
            onClose={() => setIsHelpOpen(false)}
            category={category}
            question={question}
            user={user}
        />
      )}

      {isFeedbackModalOpen && (
        <Modal title="Your Performance Feedback" onClose={() => setIsFeedbackModalOpen(false)}>
            {isAssessing && (
                <div className="flex flex-col justify-center items-center min-h-[300px]">
                    <Spinner />
                    <p className="mt-4 text-lg text-content-200">Analyzing your conversation...</p>
                </div>
            )}
            {feedback && <FeedbackDisplay feedback={feedback} user={user} />}
        </Modal>
      )}
    </>
  );
};

export default PracticeMode;