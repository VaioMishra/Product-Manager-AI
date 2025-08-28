import React from 'react';

export const StrikethroughIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-3.866 0-7 2.015-7 4.5s3.134 4.5 7 4.5c3.866 0 7-2.015 7-4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5c3.866 0 7-2.015 7-4.5s-3.134-4.5-7-4.5c-3.866 0-7 2.015-7 4.5" />
  </svg>
);
