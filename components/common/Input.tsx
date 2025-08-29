import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-2">
        {label}
      </label>
      <input
        id={inputId}
        className="w-full bg-surface-secondary text-text-primary placeholder:text-text-secondary border border-border-primary rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-shadow"
        {...props}
      />
    </div>
  );
};

export default Input;