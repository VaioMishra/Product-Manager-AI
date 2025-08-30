import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, ChatMessage, Feedback, FullInterview } from '../types';
import { generateQuestionsFromResume, getFullInterviewResponse, getAssessment } from '../services/geminiService';
import { uploadResume } from '../services/googleApiService';
import { speechService } from '../services/speechService';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Card from './common/Card';
import { UploadIcon } from './icons/UploadIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import FeedbackDisplay from './FeedbackDisplay';
import { StopIcon } from './icons/StopIcon';
import { BotIcon } from './icons/BotIcon';
import { ClockIcon } from './icons/ClockIcon';
import VoiceVisualizer from './VoiceVisualizer';
import { UserIcon } from './icons/UserIcon';
import FormattedMessage from './common/FormattedMessage';
import { PRO_TIPS } from '../constants';
import { useInterviewHistory } from '../hooks/useInterviewHistory';

interface FullInterviewModeProps {
  user: User;
  onBack: () => void;
}

type InterviewState = 'resume_upload' | 'processing_resume' | 'intro' | 'interviewing' | 'generating_feedback' | 'feedback_ready';

// Extend window type for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
    webkitAudioContext: { new(): AudioContext };
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

const GENERIC_QUESTION_POOL = [
  "Tell me about a product you launched from start to finish.",
  "Describe a time you had to influence cross-functional stakeholders without formal authority. What was the situation and how did you handle it?",
  "What is a product you use every day that you love? What's one improvement you would make to it?",
  "How do you decide what to build? Walk me through your prioritization process.",
  "Tell me about a time a project failed or didn't go as planned. What did you learn from the experience?",
  "How would you measure the success of a new feature?",
  "Describe a situation where you had to make a decision with incomplete data.",
  "What's the most important skill for a Product Manager to have and why?",
  "How do you stay up-to-date with the latest technology trends and market changes?"
];

const FullInterviewMode: React.FC<FullInterviewModeProps> = ({ user, onBack }) => {
  const [interviewState, setInterviewState] = useState<InterviewState>('resume_upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [processingError, setProcessingError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [proTip, setProTip] = useState('');
  
  const [questionPool, setQuestionPool] = useState<string[]>([]);
  const [profileSummary, setProfileSummary] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const [isListening, setIsListening] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const { addSession } = useInterviewHistory();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Fix: Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for browser compatibility.
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Comprehensive cleanup effect for when the component unmounts
  useEffect(() => {
    return () => {
      speechService.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const processFile = (file: File | undefined | null) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setProcessingError("File is too large. Please upload a resume under 10MB.");
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
      setProcessingError('');
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);

    // Attempt to re-enter fullscreen after file selection, as the file picker exits it.
    // This is a user-initiated event, so it should be allowed by most browsers.
    if (file && document.fullscreenEnabled && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Could not re-enter fullscreen: ${err.message}`);
        });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };


  const handleResumeSubmit = async () => {
    if (!resumeFile) return;

    const randomIndex = Math.floor(Math.random() * PRO_TIPS.length);
    setProTip(PRO_TIPS[randomIndex]);
    
    setInterviewState('processing_resume');
    setProcessingError('');

    try {
      setUploadStatus("Uploading resume securely...");
      await uploadResume(resumeFile, user);

      setUploadStatus("Analyzing resume with AI...");
      const base64Data = await fileToBase64(resumeFile);
      const { isResumeValid, questions, profileSummary } = await generateQuestionsFromResume({ mimeType: resumeFile.type, data: base64Data }, user);
      
      if (isResumeValid) {
        setQuestionPool(questions);
        setProfileSummary(profileSummary);
        setInterviewState('intro');
      } else {
        setProcessingError("The uploaded file doesn't appear to be a resume. Please upload a valid document or continue with a general interview.");
        setResumeFile(null); // Clear invalid file
        setInterviewState('resume_upload');
      }
    } catch (error) {
      console.error("Error processing resume:", error);
      setProcessingError("Sorry, there was an error analyzing your resume. Please try a different file or try again later.");
      setInterviewState('resume_upload');
    }
  };
  
  const handleGeneralInterview = () => {
    setProfileSummary(`A candidate named ${user.name} with ${user.yoe} years of experience.`);
    setQuestionPool(GENERIC_QUESTION_POOL);
    setInterviewState('intro');
  };

  const startInterview = async () => {
    speechService.unlockAudio();
    // Initialize AudioContext on a user gesture to ensure browser compatibility
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser.");
        }
    }
    
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        console.error("Microphone permission denied:", err);
        setProcessingError("Microphone access is required. Please grant permission and try again.");
        return;
    }

    setProcessingError('');
    setInterviewState('interviewing');
    setChatHistory([{ sender: 'bot' as const, text: `Hi ${user.name}, I'm Vaio, your interviewer for today. Thanks for submitting your resume. To start, could you briefly walk me through your experience?` }]);
  };

  const endInterview = useCallback(async () => {
      speechService.cancel();
      recognitionRef.current?.abort();
      setInterviewState('generating_feedback');

      const conversation = chatHistory
        .map(msg => `${msg.sender === 'user' ? user.name : 'Interviewer'}: ${msg.text}`)
        .join('\n\n');

      const result = await getAssessment("Full PM Interview Performance", conversation, user, "Full Interview");
      
      if (result) {
        setFeedback(result);
        const session: FullInterview = {
          id: new Date().toISOString(),
          type: 'full',
          date: new Date().toISOString(),
          chatHistory: chatHistory,
          feedback: result
        };
        addSession(session);
      } else {
        setFeedback(null); // Explicitly set to null on error
      }
      
      setInterviewState('feedback_ready');

  }, [chatHistory, user, addSession]);

  useEffect(() => {
    if (interviewState === 'interviewing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (interviewState === 'interviewing' && timeLeft === 0) {
      endInterview();
    }
  }, [interviewState, timeLeft, endInterview]);
  
  // Effect for timer sounds
  useEffect(() => {
    const playSound = (freq: number, duration: number, type: OscillatorType = 'sine') => {
      if (!audioContextRef.current) return;
      const context = audioContextRef.current;
      // Resume context if it's suspended, which can happen on page load
      if (context.state === 'suspended') {
        context.resume();
      }
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.type = type;
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);

      oscillator.start(context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + duration);
      oscillator.stop(context.currentTime + duration);
    };
    
    // Single chime for 5-minute warning
    if (timeLeft === 300) {
      playSound(880, 0.2, 'triangle'); // A higher, softer chime
    }
    
    // Ticking for last 10 seconds
    if (timeLeft > 0 && timeLeft <= 10) {
      playSound(440, 0.1); // A short tick
    }

  }, [timeLeft]);

  // Initialize speech recognition.
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
        console.warn("Speech Recognition API not supported in this browser.");
        return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript.trim()) {
            recognition.stop();
            setChatHistory(prev => [...prev, { sender: 'user', text: finalTranscript.trim() }]);
        } else {
            silenceTimerRef.current = setTimeout(() => recognition.stop(), 2000);
        }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
  }, []);
  
  // Effect to process user responses
  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage?.sender === 'user') {
        const processUserResponse = async () => {
            setChatHistory(prev => [...prev, { sender: 'bot', text: '', isThinking: true }]);
            const botResponse = await getFullInterviewResponse(chatHistory, user, profileSummary, questionPool);
            setChatHistory(prev => [...prev.slice(0, -1), { sender: 'bot', text: botResponse }]);
        };
        processUserResponse();
    }
  }, [chatHistory, user, profileSummary, questionPool]);

  // Effect to speak bot responses
  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage?.sender === 'bot' && !lastMessage.isThinking && lastMessage.text) {
        setIsBotSpeaking(true);
        speechService.speak(lastMessage.text, () => {
            setIsBotSpeaking(false);
        });
    }
  }, [chatHistory]);

  const handleInterruptAndSpeak = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      speechService.cancel();
      setIsBotSpeaking(false);
      recognitionRef.current?.start();
    }
  }, [isListening]);

  const renderContent = () => {
    switch(interviewState) {
        case 'resume_upload':
            return (
                <Card className="max-w-xl mx-auto text-center p-8">
                    <h2 className="text-3xl font-bold mb-2">Full Interview Simulation</h2>
                    <p className="text-text-secondary mb-6">For a personalized interview, upload your resume. Or, start with a general interview.</p>
                    <div className="mx-auto max-w-sm">
                        <label 
                            htmlFor="resume-upload" 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-border-primary hover:bg-surface-secondary/50'}`}
                        >
                            <UploadIcon className="w-12 h-12 text-text-secondary mb-2" />
                            <span className="font-semibold">{resumeFile ? resumeFile.name : 'Drag & drop your resume here'}</span>
                            <span className="text-sm text-text-secondary">or click to upload</span>
                            <span className="text-xs text-text-secondary mt-2">(PDF or DOCX, max 10MB)</span>
                        </label>
                        <input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    </div>
                    {processingError && <p className="text-red-500 mt-4">{processingError}</p>}
                    <Button onClick={handleResumeSubmit} disabled={!resumeFile} className="mt-6 w-full max-w-sm" size="lg">Analyze Resume & Begin</Button>
                    <div className="my-6 text-center font-semibold text-text-secondary">OR</div>
                    <Button onClick={handleGeneralInterview} variant="secondary" className="w-full max-w-sm">Continue with a General Interview</Button>
                </Card>
            );
        case 'processing_resume': return (
            <Card className="max-w-xl mx-auto text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                <h2 className="text-2xl font-bold mt-6">Processing Your Resume...</h2>
                <p className="text-text-secondary mt-2 mb-8">{uploadStatus}</p>

                {proTip && (
                  <div className="p-5 bg-surface-secondary/50 rounded-lg text-left animate-fade-in">
                    <h3 className="text-lg font-semibold mb-2 text-text-primary">
                      💡 Pro Tip
                    </h3>
                    <p className="text-text-secondary">{proTip}</p>
                  </div>
                )}
            </Card>
        );
        case 'intro': return (
            <Card className="max-w-xl mx-auto text-center p-8">
                <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
                <p className="text-text-secondary mb-6">Your interview has been prepared. Here are the rules:</p>
                <ul className="text-left space-y-2 mb-8 mx-auto max-w-md text-text-primary">
                    <li><strong>Voice Only:</strong> This is a voice-only interview to simulate a real phone screen.</li>
                    <li><strong>45-Minute Timer:</strong> The session will automatically end after 45 minutes.</li>
                    <li><strong>Interrupt Anytime:</strong> Click "Speak" to interrupt the interviewer and start your response.</li>
                </ul>
                {processingError && <p className="text-red-500 mb-4">{processingError}</p>}
                <Button onClick={startInterview} disabled={!!processingError} className="w-full max-w-sm" size="lg">Start Interview</Button>
            </Card>
        );
        case 'interviewing': {
            let visualizerStatus: 'speaking' | 'listening' | 'idle' = 'idle';
            if (isBotSpeaking) visualizerStatus = 'speaking';
            else if (isListening) visualizerStatus = 'listening';

            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh] animate-fade-in">
                    {/* Transcript Column */}
                    <div className="lg:col-span-2 bg-surface-primary/50 rounded-lg p-4 flex flex-col h-full min-h-0">
                        <h2 className="text-xl font-bold mb-4 flex-shrink-0">Interview Transcript</h2>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                    {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center shadow-lg"><BotIcon className="w-5 h-5 text-white" /></div>}
                                    <div className={`max-w-xl p-3 rounded-lg text-base leading-relaxed break-words shadow-md ${msg.sender === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-surface-secondary text-text-primary rounded-bl-none'}`}>
                                        {msg.isThinking ? 
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <span>Vaio is thinking</span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                                            </div> 
                                            : <FormattedMessage text={msg.text} /> 
                                        }
                                    </div>
                                    {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center shadow-lg"><UserIcon className="w-5 h-5 text-text-primary" /></div>}
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>
                    {/* Control Panel Column */}
                    <div className="lg:col-span-1 bg-surface-primary/50 rounded-lg p-6 flex flex-col justify-between items-center h-full text-center">
                        <div className={`flex items-center gap-2 text-3xl font-mono px-4 py-2 rounded-lg transition-colors duration-500 ${timeLeft <= 300 ? 'bg-red-900/50 text-red-400 animate-pulse' : 'bg-surface-secondary text-text-primary'}`}>
                            <ClockIcon className="w-7 h-7" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>

                        <VoiceVisualizer status={visualizerStatus} />

                        <div className="w-full space-y-3">
                           <Button onClick={handleInterruptAndSpeak} className="w-full !text-lg" size="lg" disabled={!isListening && isBotSpeaking && speechService.isPlaying() === false}>
                                <div className="flex items-center justify-center gap-2">
                                    <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'animate-pulse text-red-400': ''}`} />
                                    <span>{isListening ? "Listening..." : "Speak"}</span>
                                </div>
                           </Button>
                           <Button onClick={endInterview} variant="secondary" size="md" className="w-full">
                                <div className="flex items-center justify-center gap-2">
                                    <StopIcon className="w-5 h-5" />
                                    <span>End Interview</span>
                                </div>
                           </Button>
                        </div>
                    </div>
                </div>
            );
        }
        case 'generating_feedback': return (
            <Card className="max-w-xl mx-auto text-center p-8">
                <Spinner />
                <h2 className="text-2xl font-bold mt-4">Interview Complete!</h2>
                <p className="text-text-secondary mt-2">Generating your personalized feedback report...</p>
            </Card>
        );
        case 'feedback_ready': return (
            <div>
                {feedback ? (
                  <FeedbackDisplay feedback={feedback} user={user} />
                ) : (
                  <Card className="p-8 text-center">
                    <h3 className="text-xl font-bold mb-2">Feedback Error</h3>
                    <p className="text-text-secondary">Sorry, an error occurred while generating your feedback report.</p>
                  </Card>
                )}
                <div className="text-center mt-6 flex gap-4 justify-center">
                    <Button onClick={() => setInterviewState('resume_upload')} variant="secondary">Start New Interview</Button>
                    <Button onClick={onBack}>Back to Main Menu</Button>
                </div>
            </div>
        );
    }
  };

  return <div className="animate-fade-in">{renderContent()}</div>;
};

export default FullInterviewMode;
