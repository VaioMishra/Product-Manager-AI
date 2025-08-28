
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-content-200 mb-2">
        {label}
      </label>
      <select
        id={selectId}
        className="w-full bg-base-200 border border-base-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
