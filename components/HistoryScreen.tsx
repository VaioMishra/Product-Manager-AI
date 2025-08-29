import React, { useState } from 'react';
import { InterviewSession, User } from '../types';
import { useInterviewHistory } from '../hooks/useInterviewHistory';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import FeedbackDisplay from './FeedbackDisplay';

interface HistoryScreenProps {
  user: User; // Needed for FeedbackDisplay
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ user }) => {
  const { history, clearHistory } = useInterviewHistory();
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete your entire interview history? This action cannot be undone.")) {
      clearHistory();
    }
  };
  
  if (history.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center text-text-secondary">
          <h3 className="text-xl font-semibold text-text-primary mb-2">No History Yet</h3>
          <p>Complete a practice session or a full interview, and your results will appear here.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {selectedSession && (
        <Modal title="Interview Feedback" onClose={() => setSelectedSession(null)}>
          <FeedbackDisplay feedback={selectedSession.feedback} user={user} />
        </Modal>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Your Past Sessions</h3>
        {history.length > 0 && (
          <Button onClick={handleClearHistory} variant="secondary" size="sm">
            Clear History
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map(session => (
          <Card key={session.id} className="flex flex-col hover:-translate-y-1">
            <div className="p-5 flex-grow">
              <p className="text-sm text-text-secondary mb-2">
                {new Date(session.date).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
              </p>
              <h4 className="font-semibold text-lg mb-3 line-clamp-3">
                {session.type === 'practice' ? session.question : 'Full Interview Simulation'}
              </h4>
              {session.type === 'practice' && (
                <span className="text-xs font-medium bg-surface-secondary px-2 py-1 rounded-full text-text-secondary">
                  {session.category}
                </span>
              )}
            </div>
            <div className="p-5 border-t border-border-primary mt-auto">
              <Button onClick={() => setSelectedSession(session)} className="w-full">
                View Feedback
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoryScreen;