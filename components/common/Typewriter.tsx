import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, speed = 20 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(''); // Reset when text prop changes
    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(prev => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
      return () => clearInterval(typingInterval);
    }
  }, [text, speed]);

  return <p className="whitespace-pre-wrap">{displayedText}</p>;
};

export default Typewriter;
