
import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (id: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div className="border-b border-base-300">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-200 hover:text-content-100 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors focus:outline-none`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
