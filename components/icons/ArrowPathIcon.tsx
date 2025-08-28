import React from 'react';

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a.75.75 0 01.75.75v3.666a.75.75 0 01-.75.75H16.023v-4.501zm-1.5 0v4.501m-4.5 0V9.348m-1.5 0h4.5m-4.5 0H5.25v4.501h4.992M12 4.5v.008" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5" />
  </svg>
);