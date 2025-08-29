import React from 'react';

export const VaioLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="vaioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#7C3AED' }} />
        <stop offset="100%" style={{ stopColor: '#4F46E5' }} />
      </linearGradient>
    </defs>
    <path d="M12 2L2 22H6L12 10L18 22H22L12 2Z" fill="url(#vaioGradient)"/>
    <path d="M6 22L12 10L18 22" stroke="url(#vaioGradient)" strokeWidth="0.5" />
  </svg>
);