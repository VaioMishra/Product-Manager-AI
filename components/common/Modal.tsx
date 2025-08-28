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
        className="bg-base-200 border border-base-300 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-base-300">
          <h3 id="modal-title" className="text-xl font-bold text-content-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-base-300 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6 text-content-200" />
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