import React, { useState } from 'react';
import { User, InterviewCategory, FlowStep } from '../types';
import PracticeMode from './PracticeMode';
import Button from './common/Button';
import Tabs from './common/Tabs';
import AiArchitectDiagram from './AiArchitectDiagram';

interface InterviewScreenProps {
  user: User;
  category: InterviewCategory;
  question: string;
  onBack: () => void;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({ user, category, question, onBack }) => {
  const [activeTab, setActiveTab] = useState('practice');
  const [currentStep, setCurrentStep] = useState<FlowStep>('idle');
  const [isPlaying, setIsPlaying] = useState(true);

  const handleFlowChange = (step: FlowStep) => {
    if (isPlaying) {
      setCurrentStep(step);
      // Reset after a delay to create a pulse effect
      if (step !== 'idle') {
        setTimeout(() => setCurrentStep('idle'), 2000);
      }
    }
  };
  
  const tabs = [
    { id: 'practice', label: 'Practice Mode' },
    { id: 'architect', label: 'AI Architect' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="p-6 bg-surface-primary border border-border-primary rounded-xl shadow-md">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-brand-primary">{category}</p>
                <h2 className="text-xl md:text-2xl font-bold mt-1 text-text-primary">{question}</h2>
            </div>
            <Button onClick={onBack} variant="secondary" size="sm">
                Change Question
            </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

      <div className="mt-6">
        <div className={activeTab === 'practice' ? 'block' : 'hidden'}>
           <PracticeMode 
              user={user} 
              category={category} 
              question={question}
              onFlowChange={handleFlowChange}
          />
        </div>
        <div className={activeTab === 'architect' ? 'block' : 'hidden'}>
          <AiArchitectDiagram 
            currentStep={currentStep}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen;