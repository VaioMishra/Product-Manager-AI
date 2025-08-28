import React, { useState, useEffect } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import QuestionSelectionScreen from './components/QuestionSelectionScreen';
import InterviewScreen from './components/InterviewScreen';
import { User, InterviewCategory } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ArrowPathIcon } from './components/icons/ArrowPathIcon';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { getVisitorCount } from './services/googleApiService';
import { UsersIcon } from './components/icons/UsersIcon';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('pm-coach-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('pm-coach-user');
    }
    // We use a state to prevent a flash of the login screen
    setIsInitialized(true); 
  }, []);
  
  // Fetch visitor count on initial load
  useEffect(() => {
    const fetchVisitors = async () => {
      const count = await getVisitorCount();
      setVisitorCount(count);
    };
    fetchVisitors();
  }, []);

  const handleOnboardingComplete = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem('pm-coach-user', JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  };

  const handleQuestionSelected = (category: InterviewCategory, question: string) => {
    setSelectedCategory(category);
    setSelectedQuestion(question);
  };
  
  const handleBackToSelection = () => {
    setSelectedCategory(null);
    setSelectedQuestion('');
  };

  // This function now only resets the current question, taking the user back to the selection screen.
  const handleNewQuestion = () => {
    setSelectedCategory(null);
    setSelectedQuestion('');
  };

  // This function logs the user out, clearing their data from localStorage.
  const handleLogout = () => {
    localStorage.removeItem('pm-coach-user');
    setUser(null);
    setSelectedCategory(null);
    setSelectedQuestion('');
  };

  const renderContent = () => {
    if (!user) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
    if (!selectedCategory || !selectedQuestion) {
      return <QuestionSelectionScreen onQuestionSelect={handleQuestionSelected} user={user} />;
    }
    return <InterviewScreen 
      user={user} 
      category={selectedCategory} 
      question={selectedQuestion} 
      onBack={handleBackToSelection}
    />;
  };
  
  // Render a blank screen or a loader while checking localStorage
  if (!isInitialized) {
    return <div className="min-h-screen bg-base-100" />;
  }

  return (
    <div className="min-h-screen bg-base-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mb-8 flex items-center justify-between gap-2">
        <div className="flex-1 text-left">
           {user && <p className="text-content-200 truncate hidden md:block" title={user.name}>Welcome, {user.name}!</p>}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
          <SparklesIcon className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" />
          <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary text-center">
            PM Interview Coach
          </h1>
        </div>
        <div className="flex-1 text-right flex items-center justify-end gap-2 md:gap-4">
          {visitorCount !== null && (
            <div className="flex items-center gap-2 text-content-200" title={`${visitorCount} total visits`}>
              <UsersIcon className="w-5 h-5" />
              <span className="font-medium text-sm hidden md:inline">{visitorCount.toLocaleString()}</span>
            </div>
          )}
          {user && selectedCategory && (
            <button onClick={handleNewQuestion} className="inline-flex items-center gap-2 text-sm text-content-200 hover:text-content-100 transition-colors" title="Select New Question">
                <ArrowPathIcon className="w-5 h-5"/>
                <span className="hidden md:inline">New Question</span>
            </button>
          )}
          {user && (
             <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-content-200 hover:text-content-100 transition-colors" title="Logout">
                <LogoutIcon className="w-5 h-5"/>
                <span className="hidden md:inline">Logout</span>
            </button>
          )}
        </div>
      </header>
      <main className="w-full max-w-7xl">
        {renderContent()}
      </main>
      <footer className="w-full max-w-7xl mt-8 py-4 text-center text-content-200 text-sm">
        <p>
          Built by <a href="https://www.linkedin.com/in/vaiomishra/" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Vaibhav Mishra</a>.
        </p>
      </footer>
    </div>
  );
};

export default App;