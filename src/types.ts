export interface UserProfile {
  name: string;
  age: number;
  birthDate: string;
  weight: number;
  height: number;
  email: string;
  lastPeriodDate: string; // YYYY-MM-DD
  periodLength: number; // in days, e.g., 5
  cycleLength: number; // in days, e.g., 28
  contraceptive: string; // "Ninguno" or custom
  isCeliac?: boolean;
  hasDiabetes?: boolean;
  hasObesity?: boolean;
  hasDepression?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  sleepQuality: number; // 1-5 scale (1: Excelente, 5: Muy mala)
  fatigue: number; // 1-5 scale (1: Ninguna, 5: Extrema)
  pain: number; // 1-5 scale (1: Ninguno, 5: Muy alto)
  stress: number; // 1-5 scale (1: Muy bajo, 5: Muy alto)
  mood: number; // 1-5 scale (1: Muy feliz, 5: Muy triste)
  sleepDetails: string; // free text
  additionalNotes: string; // free text
  behavior?: string; // free text: how they behaved today (habits, physical activity, food choices)
  aiAnalysis?: string; // Cache the Gemini analysis for this specific log
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type MenstrualPhase = 'Menstrual' | 'Folicular' | 'Ovulacion' | 'Lutea';

export interface PhaseInfo {
  name: string;
  badge: string;
  colorClass: string;
  bgHex: string;
  textHex: string;
  description: string;
  hormones: string;
  stats: {
    concentration: number;
    creativity: number;
    physicalEnergy: number;
  };
  tips: string[];
  productivity: string[];
}
