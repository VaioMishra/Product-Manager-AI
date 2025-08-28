
import React, { useState } from 'react';
import { User, InterviewCategory, Feedback } from '../types';
import { getAssessment } from '../services/geminiService';
import Button from './common/Button';
import Spinner from './common/Spinner';
import Card from './common/Card';
import FeedbackDisplay from './FeedbackDisplay';

interface AssessmentModeProps {
  user: User;
  category: InterviewCategory;
  question: string;
}

const AssessmentMode: React.FC<AssessmentModeProps> = ({ user, category, question }) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    const result = await getAssessment(question, answer, user, category);
    
    if (result) {
      setFeedback(result);
    } else {
      setError("Sorry, I couldn't generate feedback for your answer. Please try again.");
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Spinner />
          <p className="mt-4 text-lg text-content-200">Analyzing your answer... This may take a moment.</p>
        </div>
      </Card>
    );
  }

  if (feedback) {
    return (
      <div>
        {/* FIX: Pass the 'user' prop to FeedbackDisplay as it is required. */}
        <FeedbackDisplay feedback={feedback} user={user} />
        <div className="text-center mt-6">
          <Button onClick={() => { setFeedback(null); setAnswer(''); }} variant="secondary">
            Try Another Answer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Submit Your Final Answer</h3>
        <p className="text-sm text-content-200">
          Take your time to structure your thoughts. When you're ready, write out your complete answer below and submit it for a detailed evaluation.
        </p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Start by clarifying the question, state your assumptions, and then walk through your structured answer..."
          className="w-full h-80 bg-base-200 border border-base-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={!answer.trim()}>
            Get Feedback
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AssessmentMode;