import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className }, ref) => {
  return (
    <div 
      ref={ref} 
      className={`
        bg-surface-primary border border-border-primary rounded-xl shadow-lg 
        transition-all duration-300 
        shadow-black/5
        dark:bg-gradient-to-b dark:from-surface-primary dark:to-surface-primary/95 
        dark:hover:border-brand-primary/30 dark:hover:shadow-2xl dark:hover:shadow-brand-primary/10 
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
});

export default Card;