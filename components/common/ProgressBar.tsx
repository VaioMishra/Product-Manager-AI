import React from 'react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center w-full" aria-label="Interview Progress">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isFuture = index > currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 transform
                  ${isActive ? 'bg-brand-primary ring-4 ring-brand-primary/30 scale-110' : ''}
                  ${isCompleted ? 'bg-brand-secondary' : ''}
                  ${isFuture ? 'bg-base-300' : ''}
                `}
                aria-current={isActive ? 'step' : false}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span className={`font-bold ${isActive ? 'text-white' : 'text-content-200'}`}>{index + 1}</span>
                )}
              </div>
              <p className={`mt-2 text-[10px] sm:text-xs font-medium w-16 sm:w-20 leading-tight transition-colors duration-500 ${isActive ? 'text-content-100' : 'text-content-200'}`}>
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 transition-colors duration-500 mx-1
                ${isCompleted || isActive ? 'bg-brand-primary' : 'bg-base-300'}
              `}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressBar;