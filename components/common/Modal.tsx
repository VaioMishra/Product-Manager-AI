import React from 'react';
import { XMarkIcon } from '../icons/XMarkIcon';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  // Handle Escape key press to close modal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-surface-primary border border-border-primary rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-border-primary">
          <h3 id="modal-title" className="text-xl font-bold text-text-primary">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-surface-secondary transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-text-secondary" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;