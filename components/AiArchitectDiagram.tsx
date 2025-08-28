import React from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { UserIcon } from './icons/UserIcon';
import { SystemIcon } from './icons/SystemIcon';
import { ApiIcon } from './icons/ApiIcon';
import { BotIcon } from './icons/BotIcon';
import { FlowStep } from '../types';

interface AiArchitectDiagramProps {
  currentStep: FlowStep;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const AiArchitectDiagram: React.FC<AiArchitectDiagramProps> = ({ currentStep, isPlaying, onTogglePlay }) => {
  const isPathActive = (step: FlowStep) => isPlaying && currentStep === step;
  const isNodeActive = (steps: FlowStep[]) => isPlaying && steps.includes(currentStep);

  const arrowMarker = (
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" className="fill-brand-primary" />
    </marker>
  );

  const Path = ({ d, step }: { d: string; step: FlowStep }) => (
    <path
      d={d}
      strokeWidth={isPathActive(step) ? 4 : 2}
      className={`transition-all duration-300 ${isPathActive(step) ? 'stroke-brand-secondary animate-march' : 'stroke-base-300'}`}
      fill="none"
      markerEnd="url(#arrow)"
    />
  );
  
  const Node = ({ x, y, icon, title, subtitle, activeSteps, isPulsing = false }: { x: number, y: number, icon: React.ReactNode, title: string, subtitle: string, activeSteps: FlowStep[], isPulsing?: boolean }) => (
     <g transform={`translate(${x}, ${y})`}>
        <rect x="-75" y="-35" width="150" height="70" rx="10" 
            className={`transition-all duration-300 ${isNodeActive(activeSteps) ? 'fill-brand-primary/10 stroke-brand-primary' : 'fill-base-200 stroke-base-300'} ${isPulsing ? 'animate-pulse-node' : ''}`}
            strokeWidth="2"
        />
        <g className="text-content-100">{icon}</g>
        <text x="0" y="15" textAnchor="middle" className="fill-content-100 font-bold text-sm">{title}</text>
        <text x="0" y="30" textAnchor="middle" className="fill-content-200 text-xs">{subtitle}</text>
    </g>
  );

  const isBrainIdle = isPlaying && currentStep === 'idle';

  return (
    <div className="p-4 bg-base-100/50 rounded-lg relative border border-base-300 animate-fade-in">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onTogglePlay} className="flex items-center gap-2 bg-base-300 px-3 py-1.5 rounded-lg text-content-100 hover:bg-base-300/80 transition-colors">
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          <span className="text-sm font-medium">{isPlaying ? 'Pause Flow' : 'Play Flow'}</span>
        </button>
      </div>
      <svg width="100%" height="500" viewBox="0 0 800 500">
        <defs>{arrowMarker}</defs>
        
        {/* Nodes */}
        <Node x={150} y={150} icon={<UserIcon x="-12" y="-25" width="24" height="24" />} title="User Interface" subtitle="Input: Text / Voice" activeSteps={['user_to_service']} />
        <Node x={400} y={150} icon={<SystemIcon x="-12" y="-25" width="24" height="24" />} title="Gemini Service" subtitle="AI Brain Logic" activeSteps={['user_to_service', 'service_to_api', 'api_to_service', 'service_to_ui']} isPulsing={isBrainIdle}/>
        <Node x={650} y={150} icon={<ApiIcon x="-12" y="-25" width="24" height="24" />} title="Google Gemini API" subtitle="External LLM" activeSteps={['service_to_api', 'api_to_service']} />
        <Node x={400} y={350} icon={<BotIcon x="-12" y="-25" width="24" height="24" />} title="User Interface" subtitle="Output: Chat / Voice" activeSteps={['service_to_ui']} />
        
        {/* Paths */}
        <Path d="M 225 150 H 325" step="user_to_service" />
        <Path d="M 475 150 H 575" step="service_to_api" />
        <Path d="M 575 170 C 525 220, 475 220, 425 170" step="api_to_service" />
        <Path d="M 400 185 V 315" step="service_to_ui" />
      </svg>
       {isPlaying && currentStep === 'idle' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-4 text-center text-sm text-content-200">
            <p>Go to the 'Practice Mode' tab, send a message, and watch the data flow here in real-time!</p>
        </div>
      )}
    </div>
  );
};

export default AiArchitectDiagram;