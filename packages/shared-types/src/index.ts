export type AgeTier = 'primary' | 'middle' | 'high_school' | 'university';

export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  age_tier: AgeTier;
  class_id: string | null;
  institution_id: string | null;
  board: string | null;
  created_at: string;
  mobile_number?: string | null;
  avatar?: string | null;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  auth_provider?: string | null;
}

export type ModuleType = 'simulation' | 'formula_lab' | 'tutor' | 'homework';

export interface SimulationConfig {
  sceneId?: string;
  parameters?: Record<string, any>;
  allowControls?: boolean;
}

export interface FormulaConfig {
  formulas?: string[];
  graphVariables?: string[];
  precision?: number;
}

export interface TutorConfig {
  systemPrompt?: string;
  temperature?: number;
  welcomeMessage?: string;
}

export interface HomeworkConfig {
  questions?: Record<string, any>[];
  timeLimitMinutes?: number;
}

export type ModuleConfig = SimulationConfig | FormulaConfig | TutorConfig | HomeworkConfig | Record<string, any>;

export interface Module {
  id: string;
  title: string;
  type: ModuleType;
  tier_min: AgeTier;
  subject: string;
  config: ModuleConfig;
  created_by: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  slug: string;
  name: string;
  svg_content: string | null;
  tags: string[];
  tier_allowed: string[];
  created_at: string;
}

export interface Assignment {
  id: string;
  module_id: string;
  class_id: string;
  due_date: string | null;
  instructions: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answers: Record<string, any>;
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface SessionEvent {
  id: string;
  student_id: string;
  module_id: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}
