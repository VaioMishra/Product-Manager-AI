import { useState, useCallback } from 'react';
import { InterviewSession } from '../types';

const HISTORY_KEY = 'pm-coach-interview-history';

export const useInterviewHistory = () => {
  const [history, setHistory] = useState<InterviewSession[]>(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      // Sort by date descending when loading
      const parsed = savedHistory ? JSON.parse(savedHistory) : [];
      return parsed.sort((a: InterviewSession, b: InterviewSession) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error("Failed to parse interview history from localStorage", error);
      localStorage.removeItem(HISTORY_KEY);
      return [];
    }
  });

  const addSession = useCallback((session: InterviewSession) => {
    setHistory(prevHistory => {
      const newHistory = [session, ...prevHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save interview session to localStorage", error);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear interview history from localStorage", error);
    }
  }, []);

  return { history, addSession, clearHistory };
};
