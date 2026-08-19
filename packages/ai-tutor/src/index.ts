export interface TutorMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const AI_TUTOR_VERSION = "0.1.0";
