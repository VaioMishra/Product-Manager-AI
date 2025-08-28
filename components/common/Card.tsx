import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className }, ref) => {
  return (
    <div ref={ref} className={`bg-base-200 border border-base-300 rounded-xl shadow-lg ${className || ''}`}>
      {children}
    </div>
  );
});

export default Card;