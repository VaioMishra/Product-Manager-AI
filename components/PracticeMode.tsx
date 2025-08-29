import React, { useState, useRef, useEffect } from 'react';
import { User, InterviewCategory, ChatMessage, Feedback, FlowStep, PracticeInterview } from '../types';
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
import { useInterviewHistory } from '../hooks/useInterviewHistory';

interface PracticeModeProps {
  user: User;
  category: InterviewCategory;
  question: string;
  onFlowChange: (step: FlowStep) => void;
}

// Extend window type for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
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
    abort: () => void;
  }
}

type FormatType = 'bold' | 'italic' | 'strike' | 'code' | 'bullet' | 'quote' | 'ordered';

const PracticeMode: React.FC<PracticeModeProps> = ({ user, category, question, onFlowChange }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addSession } = useInterviewHistory();
  
  const interviewStages = ["Clarify", "Structure", "Ideate", "Prioritize", "Summarize"];
  const [currentStep, setCurrentStep] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      handleSendMessage(transcript);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    setChatHistory([{
      sender: 'bot',
      text: `Hello ${user.name}! I'm Vaio, your AI interview coach. Let's practice this question together. When you're ready, just type or say your first thoughts.`
    }]);
  }, [user.name]);

  const handleSendMessage = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    const newChatHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text }];
    setChatHistory(newChatHistory);
    setUserInput('');
    setIsLoading(true);
    onFlowChange('user_to_service');

    setTimeout(() => onFlowChange('service_to_api'), 500);
    const { responseText, currentStage } = await getInterviewResponse(newChatHistory, question, user, category);
    onFlowChange('api_to_service');

    setChatHistory(prev => [...prev, { sender: 'bot', text: responseText }]);
    setCurrentStep(currentStage);
    setIsLoading(false);
    setTimeout(() => onFlowChange('service_to_ui'), 500);
  };
  
  const handleGetFeedback = async () => {
    setIsLoading(true);
    setIsFeedbackModalOpen(true);
    setFeedback(null);
    const conversation = chatHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}`)
      .join('\n\n');
    const result = await getAssessment(question, conversation, user, category);

    if (result) {
      const session: PracticeInterview = {
        id: new Date().toISOString(),
        type: 'practice',
        date: new Date().toISOString(),
        question,
        category,
        chatHistory: chatHistory,
        feedback: result,
      };
      addSession(session);
    }
    
    setFeedback(result);
    setIsLoading(false);
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      speechService.unlockAudio();
      recognitionRef.current?.start();
    }
  };

  const applyFormat = (type: FormatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = userInput.substring(start, end);
    const beforeText = userInput.substring(0, start);
    const afterText = userInput.substring(end);

    let formattedText = '';
    switch(type) {
      case 'bold': formattedText = `**${selectedText}**`; break;
      case 'italic': formattedText = `*${selectedText}*`; break;
      case 'strike': formattedText = `~~${selectedText}~~`; break;
      case 'code': formattedText = `\`${selectedText}\``; break;
      case 'quote': formattedText = `> ${selectedText || ' '}`; break;
      case 'bullet': formattedText = `- ${selectedText || ' '}`; break;
      case 'ordered': formattedText = `1. ${selectedText || ' '}`; break;
      default: return;
    }
    
    const newText = beforeText + formattedText + afterText;
    setUserInput(newText);
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(userInput);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {isHelpOpen && <HelpGuide onClose={() => setIsHelpOpen(false)} question={question} category={category} user={user} />}
      {isFeedbackModalOpen && (
        <Modal title="Performance Feedback" onClose={() => setIsFeedbackModalOpen(false)}>
          {isLoading && !feedback ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Spinner />
              <p className="mt-4 text-text-secondary">Analyzing your conversation...</p>
            </div>
          ) : feedback ? (
            <FeedbackDisplay feedback={feedback} user={user} />
          ) : (
             <div className="flex flex-col items-center justify-center min-h-[300px]">
                <p className="text-text-secondary text-center">Sorry, an error occurred while generating feedback.</p>
             </div>
          )}
        </Modal>
      )}

      <div className="lg:col-span-2">
        <Card>
          <div className="p-4 flex flex-col h-[70vh]">
            <div className="p-4 border-b border-border-primary">
              <ProgressBar steps={interviewStages} currentStep={currentStep} />
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                   {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
                   <div className={`max-w-xl p-3 rounded-lg text-base leading-relaxed break-words shadow-md ${msg.sender === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-surface-secondary text-text-primary rounded-bl-none'}`}>
                      <FormattedMessage text={msg.text} />
                   </div>
                   {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center"><UserIcon className="w-5 h-5 text-text-primary" /></div>}
                </div>
              ))}
              {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.sender === 'user' && (
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>
                    <div className="max-w-xl p-3 rounded-lg bg-surface-secondary">
                        <div className="flex items-center gap-2 text-text-secondary">
                           <span className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
                           <span className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                           <span className="w-2 h-2 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                        </div>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-border-primary">
                <div className="bg-surface-secondary rounded-lg">
                    <div className="p-2 flex items-center gap-2 border-b border-border-primary overflow-x-auto">
                       <button title="Bold" onClick={() => applyFormat('bold')} className="p-1.5 hover:bg-border-primary rounded"><BoldIcon className="w-5 h-5 text-text-secondary" /></button>
                       <button title="Italic" onClick={() => applyFormat('italic')} className="p-1.5 hover:bg-border-primary rounded"><ItalicIcon className="w-5 h-5 text-text-secondary" /></button>
                       <button title="Strikethrough" onClick={() => applyFormat('strike')} className="p-1.5 hover:bg-border-primary rounded"><StrikethroughIcon className="w-5 h-5 text-text-secondary" /></button>
                       <button title="Code" onClick={() => applyFormat('code')} className="p-1.5 hover:bg-border-primary rounded"><CodeBracketIcon className="w-5 h-5 text-text-secondary" /></button>
                       <div className="w-px h-5 bg-border-primary mx-1"></div>
                       <button title="Bulleted List" onClick={() => applyFormat('bullet')} className="p-1.5 hover:bg-border-primary rounded"><ListBulletIcon className="w-5 h-5 text-text-secondary" /></button>
                       <button title="Numbered List" onClick={() => applyFormat('ordered')} className="p-1.5 hover:bg-border-primary rounded"><OrderedListIcon className="w-5 h-5 text-text-secondary" /></button>
                       <button title="Blockquote" onClick={() => applyFormat('quote')} className="p-1.5 hover:bg-border-primary rounded"><ChatBubbleQuoteIcon className="w-5 h-5 text-text-secondary" /></button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer here, or use the microphone..."
                        className="w-full h-24 bg-transparent p-3 focus:outline-none resize-none placeholder:text-text-secondary"
                        disabled={isLoading}
                    />
                </div>
                <div className="mt-3 flex justify-between items-center">
                    <p className="text-xs text-text-secondary">Enter to send, Shift+Enter for new line.</p>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleListen} title="Use Microphone" className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-surface-secondary'}`} disabled={isLoading}>
                          <MicrophoneIcon className="w-6 h-6" />
                        </button>
                        <Button onClick={() => handleSendMessage(userInput)} disabled={isLoading || !userInput.trim()}>
                            {isLoading ? <Spinner /> : 'Send'}
                        </Button>
                    </div>
                </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <Card>
            <div className="p-5">
                <h3 className="font-semibold text-lg mb-3">Controls</h3>
                <div className="space-y-3">
                    <Button onClick={() => setIsHelpOpen(true)} variant="secondary" className="w-full">Get Help</Button>
                    <Button onClick={handleGetFeedback} disabled={chatHistory.length < 2 || isLoading} className="w-full">Get Feedback</Button>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default PracticeMode;