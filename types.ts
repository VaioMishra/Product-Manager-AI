export enum InterviewCategory {
  PRODUCT_SENSE = "Product Sense",
  ROOT_CAUSE_ANALYSIS = "Root Cause Analysis (RCA)",
  PRODUCT_DESIGN = "Product Design",
  PRODUCT_STRATEGY = "Product Strategy",
  ESTIMATION = "Estimation",
}

export interface User {
  name: string;
  yoe: number;
  resumeLink?: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  isThinking?: boolean;
}

export interface Feedback {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  scores: {
    structure: number;
    creativity: number;
    strategy: number;
    prioritization: number;
    communication: number;
  };
}

export interface Question {
  text: string;
  category: InterviewCategory;
  company: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type FlowStep = 'idle' | 'user_to_service' | 'service_to_api' | 'api_to_service' | 'service_to_ui';