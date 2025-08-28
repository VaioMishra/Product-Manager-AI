import React, { useState, useMemo, useEffect } from 'react';
import { InterviewCategory, Question, User } from '../types';
import { QUESTION_BANK, PRO_TIPS } from '../constants';
import Button from './common/Button';
import Input from './common/Input';
import Card from './common/Card';
import Select from './common/Select';

interface QuestionSelectionScreenProps {
  user: User;
  onQuestionSelect: (category: InterviewCategory, question: string) => void;
}

const categories = Object.values(InterviewCategory);
const difficulties: Array<'All' | 'Easy' | 'Medium' | 'Hard'> = ['All', 'Easy', 'Medium', 'Hard'];

const QuestionSelectionScreen: React.FC<QuestionSelectionScreenProps> = ({ user, onQuestionSelect }) => {
  const [activeCategory, setActiveCategory] = useState<InterviewCategory>(InterviewCategory.PRODUCT_SENSE);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customCategory, setCustomCategory] = useState<InterviewCategory>(InterviewCategory.PRODUCT_SENSE);

  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [proTip, setProTip] = useState('');

  useEffect(() => {
    // Select a random tip when the component mounts
    const randomIndex = Math.floor(Math.random() * PRO_TIPS.length);
    setProTip(PRO_TIPS[randomIndex]);
  }, []); // Empty dependency array ensures this runs only once

  const handleCustomQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      onQuestionSelect(customCategory, customQuestion);
    }
  };
  
  const filteredAndSortedQuestions = useMemo(() => {
    let questions = QUESTION_BANK.filter(q => q.category === activeCategory);

    // Apply difficulty filter
    if (difficultyFilter !== 'All') {
      questions = questions.filter(q => q.difficulty === difficultyFilter);
    }

    // Default to random shuffling
    questions.sort(() => Math.random() - 0.5);

    return questions;
  }, [activeCategory, difficultyFilter]);


  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-3xl font-bold text-center">Hello, {user.name}! Let's get started.</h2>
      
      <Card className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 border-brand-primary/30">
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="flex-grow">
            <h3 className="text-xl font-bold mb-2 text-content-100">
              Ready for a Real Challenge?
            </h3>
            <p className="text-content-200 mb-4 md:mb-0">
              Put your skills to the test with a live mock interview. Get personalized, expert feedback from Vaibhav Mishra to land your dream PM role. Slots are limited and it's free!
            </p>
          </div>
          <a href="https://calendly.com/vaibhav22" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <Button size="lg">Book Your Free Mock Interview</Button>
          </a>
        </div>
      </Card>
      
      {proTip && (
        <Card className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border-brand-primary/20">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-2 text-content-100">
              💡 Pro Tip from <a href="https://www.linkedin.com/in/vaiomishra/" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Vaibhav Mishra</a>
            </h3>
            <p className="text-content-200">{proTip}</p>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Enter Your Own Question</h3>
          <form onSubmit={handleCustomQuestionSubmit} className="space-y-4">
            <Input
              label="Your Interview Question"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g., Design a product for remote fitness"
            />
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value as InterviewCategory)}
              className="w-full bg-base-200 border border-base-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <Button type="submit" disabled={!customQuestion.trim()}>Start with this Question</Button>
          </form>
        </div>
      </Card>

      <div className="text-center font-semibold text-content-200">OR</div>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Choose from our Question Bank</h3>
          <div className="flex flex-wrap gap-2 mb-6 border-b border-base-300 pb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                    setActiveCategory(cat);
                    setDifficultyFilter('All');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeCategory === cat ? 'bg-brand-primary text-white' : 'bg-base-200 hover:bg-base-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-content-200 mb-2">
              Filter by Difficulty
            </label>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${
                    difficultyFilter === diff ? 'bg-brand-secondary text-white' : 'bg-base-300 hover:bg-base-300/80'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
          
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredAndSortedQuestions.length > 0 ? (
                filteredAndSortedQuestions.map((q, index) => (
                    <li key={`${q.text}-${index}`} className="p-4 bg-base-200 rounded-lg flex items-center justify-between gap-4 hover:bg-base-300 transition-colors">
                        <div className="flex-grow">
                        <p className="text-content-100">{q.text}</p>
                        <div className="flex items-center gap-2 text-xs text-content-200 mt-1">
                            <span className="bg-base-300 px-2 py-0.5 rounded-full">{q.company}</span>
                            <span className={`px-2 py-0.5 rounded-full ${q.difficulty === 'Hard' ? 'bg-red-900/50' : q.difficulty === 'Medium' ? 'bg-yellow-900/50' : 'bg-green-900/50'}`}>{q.difficulty}</span>
                        </div>
                        </div>
                        <Button onClick={() => onQuestionSelect(q.category, q.text)} size="sm">
                        Practice
                        </Button>
                    </li>
                ))
            ) : (
                <li className="p-8 text-center text-content-200 bg-base-100 rounded-lg">
                    No questions match your current filters. Try a different combination!
                </li>
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default QuestionSelectionScreen;