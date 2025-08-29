import React, { useState, useEffect } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import QuestionSelectionScreen from './components/QuestionSelectionScreen';
import InterviewScreen from './components/InterviewScreen';
import { User, InterviewCategory } from './types';
import { VaioLogo } from './components/icons/VaioLogo';
import { ArrowPathIcon } from './components/icons/ArrowPathIcon';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { getVisitorCount } from './services/googleApiService';
import { UsersIcon } from './components/icons/UsersIcon';
import FullInterviewMode from './components/FullInterviewMode';
import ThemeSwitcher from './components/common/ThemeSwitcher';

type AppMode = 
  | { name: 'onboarding' }
  | { name: 'selection' }
  | { name: 'practice', category: InterviewCategory, question: string }
  | { name: 'full_interview' };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appMode, setAppMode] = useState<AppMode>({ name: 'onboarding' });
  const [isInitialized, setIsInitialized] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('theme') === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('pm-coach-user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setAppMode({ name: 'selection' });
      } else {
        setAppMode({ name: 'onboarding' });
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('pm-coach-user');
      setAppMode({ name: 'onboarding' });
    }
    setIsInitialized(true);
  }, []);
  
  useEffect(() => {
    const fetchVisitors = async () => {
      const count = await getVisitorCount();
      setVisitorCount(count);
    };
    fetchVisitors();
  }, []);

  const handleOnboardingComplete = (userData: User) => {
    setUser(userData);
    setAppMode({ name: 'selection' });
    try {
      localStorage.setItem('pm-coach-user', JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  };

  const startPracticeMode = (category: InterviewCategory, question: string) => {
    setAppMode({ name: 'practice', category, question });
  };
  
  const startFullInterviewMode = () => {
    setAppMode({ name: 'full_interview' });
  };

  const handleBackToSelection = () => {
    setAppMode({ name: 'selection' });
  };
  
  const handleLogoClick = () => {
    if (user && appMode.name !== 'selection') {
      handleBackToSelection();
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('pm-coach-user');
    setUser(null);
    setAppMode({ name: 'onboarding' });
  };

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const renderContent = () => {
    if (!user) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
    
    switch(appMode.name) {
      case 'selection':
        return <QuestionSelectionScreen 
          onQuestionSelect={startPracticeMode} 
          onStartFullInterview={startFullInterviewMode}
          user={user} 
        />;
      case 'practice':
        return <InterviewScreen 
          user={user} 
          category={appMode.category} 
          question={appMode.question} 
          onBack={handleBackToSelection}
        />;
      case 'full_interview':
        return <FullInterviewMode
          user={user}
          onBack={handleBackToSelection}
        />;
      default:
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }
  };
  
  if (!isInitialized) {
    return <div className="min-h-screen bg-bg-primary" />;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mb-8 flex items-center justify-between gap-2">
        <div className="flex-1 text-left">
           {/* Empty Spacer */}
        </div>
        <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center gap-2 sm:gap-3 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg p-1 -ml-1">
          <VaioLogo className="w-8 h-8 sm:w-10 sm:h-10 text-brand-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary text-center">
            Vaio
          </h1>
        </button>
        <div className="flex-1 text-right flex items-center justify-end gap-2 md:gap-4">
          <ThemeSwitcher theme={theme} onToggle={handleThemeToggle} />
          {visitorCount !== null && (
            <div className="flex items-center gap-2 text-text-secondary" title={`${visitorCount} total visits`}>
              <UsersIcon className="w-5 h-5" />
              <span className="font-medium text-sm hidden md:inline">{visitorCount.toLocaleString()}</span>
            </div>
          )}
          {user && appMode.name !== 'onboarding' && appMode.name !== 'selection' && (
            <button onClick={handleBackToSelection} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors" title="Back to Selection">
                <ArrowPathIcon className="w-5 h-5"/>
                <span className="hidden md:inline">Back to Selection</span>
            </button>
          )}
          {user && (
             <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors" title="Logout">
                <LogoutIcon className="w-5 h-5"/>
                <span className="hidden md:inline">Logout</span>
            </button>
          )}
        </div>
      </header>
      <main className="w-full max-w-7xl">
        {renderContent()}
      </main>
      <footer className="w-full max-w-7xl mt-8 py-4 text-center text-text-secondary text-sm">
        <p>
          Built by <a href="https://www.linkedin.com/in/vaiomishra/" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Vaibhav Mishra</a>.
        </p>
      </footer>
    </div>
  );
};

export default App;