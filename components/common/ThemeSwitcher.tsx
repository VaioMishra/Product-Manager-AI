import React from 'react';
import { SunIcon } from '../icons/SunIcon';
import { MoonIcon } from '../icons/MoonIcon';

interface ThemeSwitcherProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary focus:ring-brand-primary ${
        isDark ? 'bg-brand-primary' : 'bg-surface-secondary'
      }`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-in-out ${
          isDark ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <SunIcon className={`absolute left-1.5 h-4 w-4 text-yellow-400 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
      <MoonIcon className={`absolute right-1.5 h-4 w-4 text-white transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
};

export default ThemeSwitcher;
