

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum Language {
  EN = 'en',
  AR = 'ar'
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_verified?: boolean; // For UI flow
  subscription_tier?: 'free' | 'pro' | 'school';
  subscription_status?: 'active' | 'canceled' | 'past_due';
  quizzes_created_this_month?: number;
  billing_cycle_start?: string;
}

export enum QuestionType {
  TRUE_FALSE = 'TRUE_FALSE',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  FILL_BLANK = 'FILL_BLANK',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  ESSAY = 'ESSAY',
  NUMERICAL = 'NUMERICAL',
  GRAPHICAL = 'GRAPHICAL'
}

export interface Question {
  id: string;
  quiz_id?: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For choice based
  correct_answer?: string | string[] | Record<string, string>; // Varied based on type
  points: number;
  explanation?: string;
  media_url?: string; // For images/graphs
  svg_content?: string; // AI Generated Vector Graphics
  option_visuals?: string[];
}

export interface QuizSettings {
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  grading_mode?: 'AUTO' | 'MANUAL';
}

export interface QuizResource {
  name: string;
  type: string;
  url?: string;
}

export interface QuizInvite {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
  invited_at: string;
}

export interface Submission {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name?: string; // Joined
  student_email?: string; // Joined
  score: number;
  answers: any;
  grading_details?: Array<{
    question_id: string;
    points_awarded: number;
    max_points: number;
  }>; // Array of grading details per question
  status: 'GRADED' | 'PENDING_REVIEW';
  submitted_at: string;
}

export interface Quiz {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  language: Language;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questions: Question[];
  settings: QuizSettings;
  created_at: string;
  ai_prompt?: string;
  resources?: QuizResource[];
  invites?: QuizInvite[];
}

export interface TeachingGuide {
  id: string;
  title: string;
  summary: string;
  key_points: string[];
  teaching_steps: Array<{ step: string; detail: string }>;
  suggestions: string[];
  created_at: string;
}

// AI Types
export interface AIQuizGenerationParams {
  topic: string;
  resources: { mimeType: string; data: string }[]; // base64
  language: Language;
  difficulty: string;
  gradeLevel: string;
  typeCounts: Record<QuestionType, number>;
}

// Notifications
export enum NotificationType {
  QUIZ_INVITE = 'QUIZ_INVITE',
  QUIZ_SUBMISSION = 'QUIZ_SUBMISSION'
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  quiz_id?: string;
  related_user_name?: string;
  is_read: boolean;
  created_at: string;
}

// Student Profile Types
export interface StudentDetails {
  student_id: string;
  teacher_id: string;
  phone?: string;
  address?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  notes?: string;
}

export interface QuizHistoryItem {
  quiz_id: string;
  quiz_title: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
  invited_at: string;
  score: number | null;
  max_score: number | null;
}

export interface StudentProfile {
  user: User;
  details: StudentDetails | null;
  quizHistory: QuizHistoryItem[];
  stats: {
    totalInvited: number;
    totalCompleted: number;
    averageScore: number;
    completionRate: number;
  };
}

