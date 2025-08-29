import React, { useState, useMemo, useEffect } from 'react';
import { InterviewCategory, Question, User } from '../types';
import { QUESTION_BANK, PRO_TIPS } from '../constants';
import Button from './common/Button';
import Input from './common/Input';
import Card from './common/Card';
import { SparklesIcon } from './icons/SparklesIcon';
import Tabs from './common/Tabs';

interface QuestionSelectionScreenProps {
  user: User;
  onQuestionSelect: (category: InterviewCategory, question: string) => void;
  onStartFullInterview: () => void;
}

const categories = Object.values(InterviewCategory);
const difficulties: Array<'All' | 'Easy' | 'Medium' | 'Hard'> = ['All', 'Easy', 'Medium', 'Hard'];

const QuestionSelectionScreen: React.FC<QuestionSelectionScreenProps> = ({ user, onQuestionSelect, onStartFullInterview }) => {
  const [activeCategory, setActiveCategory] = useState<InterviewCategory>(InterviewCategory.PRODUCT_SENSE);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customCategory, setCustomCategory] = useState<InterviewCategory>(InterviewCategory.PRODUCT_SENSE);
  const [practiceTab, setPracticeTab] = useState<'bank' | 'custom'>('bank');

  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [proTip, setProTip] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PRO_TIPS.length);
    setProTip(PRO_TIPS[randomIndex]);
  }, []);

  const handleCustomQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      onQuestionSelect(customCategory, customQuestion);
    }
  };
  
  const filteredAndSortedQuestions = useMemo(() => {
    let questions = QUESTION_BANK.filter(q => q.category === activeCategory);
    if (difficultyFilter !== 'All') {
      questions = questions.filter(q => q.difficulty === difficultyFilter);
    }
    return questions.sort(() => Math.random() - 0.5);
  }, [activeCategory, difficultyFilter]);

  const practiceTabs = [
    { id: 'bank', label: 'Question Bank' },
    { id: 'custom', label: 'Your Own Question' },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <h2 className="text-3xl font-bold text-center">Hello, {user.name}! Let's get started.</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-gradient-to-r from-brand-primary to-brand-secondary p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left relative overflow-hidden">
            <SparklesIcon className="absolute -top-8 -left-8 w-32 h-32 text-white/10" />
            <div className="flex-grow z-10">
              <h3 className="text-2xl font-bold mb-2 text-white">
                The Full Interview Experience
              </h3>
              <p className="text-white/80 mb-4 md:mb-0 max-w-2xl">
                Simulate a real screening call with a personalized, 45-minute voice-only mock interview based on your resume.
              </p>
            </div>
            <div className="flex-shrink-0 z-10">
              <Button size="lg" onClick={onStartFullInterview} variant="secondary">Start Full Interview</Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Practice with a Specific Question...</h3>
              <Tabs tabs={practiceTabs} activeTab={practiceTab} onTabClick={(id) => setPracticeTab(id as 'bank' | 'custom')} />
              
              <div className="mt-6">
                {practiceTab === 'bank' && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-border-primary pb-4">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setActiveCategory(cat); setDifficultyFilter('All'); }}
                          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeCategory === cat ? 'bg-brand-primary text-white' : 'bg-surface-secondary text-text-primary hover:bg-border-primary'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text-secondary mb-2">Filter by Difficulty</label>
                      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                        {difficulties.map(diff => (
                          <button
                            key={diff}
                            onClick={() => setDifficultyFilter(diff)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${difficultyFilter === diff ? 'bg-brand-secondary text-white' : 'bg-surface-secondary text-text-primary hover:bg-border-primary'}`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <ul className="space-y-3 max-h-[40rem] overflow-y-auto pr-2">
                      {filteredAndSortedQuestions.length > 0 ? (
                          filteredAndSortedQuestions.map((q, index) => (
                              <li key={`${q.text}-${index}`} className="p-4 bg-bg-primary rounded-lg flex items-center justify-between gap-4 hover:bg-surface-secondary/50 transition-colors">
                                  <div className="flex-grow">
                                  <p className="text-text-primary">{q.text}</p>
                                  <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                                      <span className="bg-surface-secondary px-2 py-0.5 rounded-full">{q.company}</span>
                                      <span className={`px-2 py-0.5 rounded-full ${q.difficulty === 'Hard' ? 'bg-red-900/50 text-red-400' : q.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'}`}>{q.difficulty}</span>
                                  </div>
                                  </div>
                                  <Button onClick={() => onQuestionSelect(q.category, q.text)} size="sm">
                                  Practice
                                  </Button>
                              </li>
                          ))
                      ) : (
                          <li className="p-8 text-center text-text-secondary bg-bg-primary rounded-lg">
                              No questions match your current filters. Try a different combination!
                          </li>
                      )}
                    </ul>
                  </div>
                )}
                {practiceTab === 'custom' && (
                  <form onSubmit={handleCustomQuestionSubmit} className="space-y-4 animate-fade-in">
                    <Input
                      label="Your Interview Question"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="e.g., Design a product for remote fitness"
                    />
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as InterviewCategory)}
                      className="w-full bg-surface-primary border border-border-primary rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <Button type="submit" disabled={!customQuestion.trim()}>Start with this Question</Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 border-brand-primary/30">
            <div className="p-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-2 text-text-primary">
                Ready for a Real Challenge?
              </h3>
              <p className="text-text-secondary mb-4">
                Put your skills to the test with a live mock interview. Get personalized, expert feedback from Vaibhav Mishra to land your dream PM role.
              </p>
              <a href="https://calendly.com/vaibhav22" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button size="md" className="w-full">Book a Free Mock Interview</Button>
              </a>
            </div>
          </Card>
          
          {proTip && (
            <Card>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-2 text-text-primary">
                  💡 Pro Tip
                </h3>
                <p className="text-text-secondary">{proTip}</p>
                 <p className="text-sm text-text-secondary mt-3">- <a href="https://www.linkedin.com/in/vaiomishra/" target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">Vaibhav Mishra</a></p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionScreen;