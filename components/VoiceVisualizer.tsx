import React from 'react';

type VisualizerStatus = 'speaking' | 'listening' | 'idle';

interface VoiceVisualizerProps {
  status: VisualizerStatus;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status }) => {
  const statusConfig = {
    speaking: {
      text: "Interviewer is speaking...",
      animationClass: "animate-radiate",
      orbClass: "bg-brand-secondary",
    },
    listening: {
      text: "Listening for your response...",
      animationClass: "animate-pulse-fast",
      orbClass: "bg-green-500",
    },
    idle: {
      text: "Ready when you are",
      animationClass: "animate-pulse-slow",
      orbClass: "bg-brand-primary",
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.idle;

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full ${currentStatus.orbClass} opacity-20 ${currentStatus.animationClass}`} style={{ animationDelay: '0.5s' }} />
        <div className={`absolute inset-0 rounded-full ${currentStatus.orbClass} opacity-30 ${currentStatus.animationClass}`} />
        <div className={`relative w-28 h-28 rounded-full ${currentStatus.orbClass} transition-colors duration-500 shadow-2xl`} />
      </div>
      <p className="text-xl font-semibold text-content-100 min-h-[28px]">{currentStatus.text}</p>
    </div>
  );
};

export default VoiceVisualizer;
