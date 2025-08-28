
import React from 'react';
import { User, InterviewCategory } from '../types';
import PracticeMode from './PracticeMode';
import Button from './common/Button';

interface InterviewScreenProps {
  user: User;
  category: InterviewCategory;
  question: string;
  onBack: () => void;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({ user, category, question, onBack }) => {

  return (
    <div className="animate-fade-in">
      <div className="mb-6 p-6 bg-base-200 border border-base-300 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-brand-primary">{category}</p>
                <h2 className="text-xl md:text-2xl font-bold mt-1 text-content-100">{question}</h2>
            </div>
            <Button onClick={onBack} variant="secondary" size="sm">
                Change Question
            </Button>
        </div>
      </div>

      <PracticeMode 
          user={user} 
          category={category} 
          question={question} 
      />
    </div>
  );
};

export default InterviewScreen;