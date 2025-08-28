import React, { useState } from 'react';
import { User } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Card from './common/Card';
import { logNewUser } from '../services/googleApiService';
import Spinner from './common/Spinner';

interface OnboardingScreenProps {
  onComplete: (user: User) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [yoe, setYoe] = useState<number | ''>('');
  const [resumeLink, setResumeLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && typeof yoe === 'number' && yoe >= 0) {
      setIsSubmitting(true);
      const user: User = { name, yoe, resumeLink };
      await logNewUser(user);
      setIsSubmitting(false);
      onComplete(user);
    }
  };

  return (
    <div className="flex justify-center items-center h-full animate-fade-in">
      <Card className="max-w-md w-full">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-2 text-content-100">Welcome, Future PM!</h2>
          <p className="text-center text-content-200 mb-6">Let's get you ready for your next big interview.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="What's your name?"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex"
              required
            />
            <Input
              label="Years of Experience (YoE)"
              type="number"
              value={yoe}
              onChange={(e) => setYoe(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="e.g., 5"
              required
              min="0"
            />
            <Input
              label="Resume Link (Optional)"
              type="url"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              placeholder="e.g., https://linkedin.com/in/..."
            />
            <Button type="submit" className="w-full" disabled={!name || yoe === '' || isSubmitting}>
              {isSubmitting ? <Spinner /> : 'Start Prep'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingScreen;