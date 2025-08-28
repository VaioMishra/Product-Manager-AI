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
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import Modal from './common/Modal';
import FeedbackDisplay from './FeedbackDisplay';
import HelpGuide from './HelpGuide';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ChatBubbleQuoteIcon } from './icons/ChatBubbleQuoteIcon';
import { BoldIcon } from './icons/BoldIcon';
import { ItalicIcon } from './icons/ItalicIcon';
import { StrikethroughIcon } from './icons/StrikethroughIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { OrderedListIcon } from './icons/OrderedListIcon';
import FormattedMessage from './common/FormattedMessage';

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

type FormatType = 'bold' | 'italic' | 'strike' | 'code' | 'bullet' | 'quote' | 'ordered';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initialMessage = `Hi ${user.name}, I'm Vaibhav, your interviewer. Let's discuss the following: "${question}". How would you approach this?`;
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
    // Auto-resize textarea based on content
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto'; // Reset height to shrink when text is deleted
      el.style.height = `${el.scrollHeight}px`; // Set height to scroll height
    }
  }, [userInput]);

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
        if(event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
        }
        setIsListening(false);
      };

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    speechService.unlockAudio(); // Unlock audio context on user gesture
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      speechService.cancel();
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isLoading) return;

    speechService.unlockAudio(); // Unlock audio context on user gesture
    speechService.cancel();
    
    const currentUserInput = userInput;
    setUserInput(''); // Clear input immediately
    
    const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: currentUserInput }];
    setChatHistory(newHistory);
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
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };
  
  const handleFormatClick = (format: FormatType) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    let textToInsert = '';
    let newCursorPos = selectionStart;

    if (format === 'bullet' || format === 'quote' || format === 'ordered') {
        const formatChar = format === 'bullet' ? '-' : format === 'quote' ? '>' : '1.';
        const textBeforeCursor = value.substring(0, selectionStart);
        const atStartOfLine = selectionStart === 0 || textBeforeCursor.endsWith('\n');
        textToInsert = atStartOfLine ? `${formatChar} ` : `\n${formatChar} `;
        newCursorPos = selectionStart + textToInsert.length;
    } else {
        // Selection-based formatting
        let prefix = '', suffix = '';
        switch (format) {
            case 'bold': prefix = '**'; suffix = '**'; break;
            case 'italic': prefix = '*'; suffix = '*'; break;
            case 'strike': prefix = '~~'; suffix = '~~'; break;
            case 'code': prefix = '`'; suffix = '`'; break;
        }

        if (selectedText) {
            textToInsert = prefix + selectedText + suffix;
            newCursorPos = selectionStart + textToInsert.length;
        } else {
            textToInsert = prefix + suffix;
            newCursorPos = selectionStart + prefix.length;
        }
    }
        
    const newValue = 
        value.substring(0, selectionStart) + 
        textToInsert + 
        value.substring(selectionEnd);
        
    setUserInput(newValue);
    
    // Defer focusing and setting cursor to after the re-render
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmitForFeedback = async () => {
      setIsAssessing(true);
      setIsFeedbackModalOpen(true);
      setFeedback(null);
      
      const conversation = chatHistory
        .map(msg => `${msg.sender === 'user' ? user.name : 'Vaibhav'}: ${msg.text}`)
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
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 border-b border-base-300 pb-3 gap-4 sm:gap-2">
            <ProgressBar steps={interviewStages} currentStep={currentStep} />
            <div className="flex gap-2 flex-shrink-0 sm:ml-4">
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
                <div className={`max-w-md md:max-w-lg p-3 rounded-lg border text-base leading-relaxed break-words
                  ${msg.sender === 'user' 
                    ? 'bg-brand-primary/80 backdrop-blur-sm border-brand-secondary text-white rounded-br-none shadow-lg' 
                    : 'bg-base-200/50 backdrop-blur-sm border-base-300 text-content-100 rounded-bl-none shadow-lg'}`
                }>
                  {msg.isThinking ? <Spinner /> : <FormattedMessage text={msg.text} /> }
                </div>
                {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center shadow-lg"><UserIcon className="w-5 h-5" /></div>}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-4 border-t border-base-300 pt-4">
            <div className="bg-base-200 border border-base-300 rounded-lg">
                <form onSubmit={handleSendMessage}>
                    <div className="p-2 border-b border-base-300 flex items-center gap-1">
                        <button type="button" onClick={() => handleFormatClick('bold')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Bold" disabled={isLoading}>
                            <BoldIcon className="w-5 h-5 text-content-200" />
                        </button>
                         <button type="button" onClick={() => handleFormatClick('italic')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Italic" disabled={isLoading}>
                            <ItalicIcon className="w-5 h-5 text-content-200" />
                        </button>
                         <button type="button" onClick={() => handleFormatClick('strike')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Strikethrough" disabled={isLoading}>
                            <StrikethroughIcon className="w-5 h-5 text-content-200" />
                        </button>
                         <button type="button" onClick={() => handleFormatClick('code')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Code" disabled={isLoading}>
                            <CodeBracketIcon className="w-5 h-5 text-content-200" />
                        </button>
                        <div className="w-px h-5 bg-base-300 mx-1"></div>
                        <button type="button" onClick={() => handleFormatClick('bullet')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Bullet list" disabled={isLoading}>
                            <ListBulletIcon className="w-5 h-5 text-content-200" />
                        </button>
                        <button type="button" onClick={() => handleFormatClick('ordered')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Numbered list" disabled={isLoading}>
                            <OrderedListIcon className="w-5 h-5 text-content-200" />
                        </button>
                        <button type="button" onClick={() => handleFormatClick('quote')} className="p-1 rounded hover:bg-base-300 disabled:opacity-50" title="Blockquote" disabled={isLoading}>
                            <ChatBubbleQuoteIcon className="w-5 h-5 text-content-200" />
                        </button>
                    </div>
                    <div className="flex gap-2 p-2 items-end">
                        <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isListening ? "Listening..." : "Type your response... (Shift+Enter for new line)"}
                            className="flex-grow bg-transparent focus:outline-none resize-none overflow-y-auto max-h-40"
                            disabled={isLoading}
                            rows={1}
                        />
                        <div className="flex-shrink-0 flex items-center gap-2">
                            {recognitionRef.current && (
                                <Button type="button" onClick={handleMicClick} variant="secondary" className="px-2.5 py-2.5" aria-label="Use microphone" title="Use microphone" disabled={isLoading}>
                                    <MicrophoneIcon className={`w-5 h-5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-content-200'}`} />
                                </Button>
                            )}
                            <Button type="submit" disabled={isLoading || !userInput.trim()}>
                                {isLoading ? <Spinner /> : 'Send'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
            <p className="text-xs text-content-200 text-center mt-2 md:hidden">
              Note: Voice input and narration may have limitations on mobile browsers.
            </p>
          </div>
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