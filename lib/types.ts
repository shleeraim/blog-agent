// ============================================================
// Blog Agent - Type Definitions
// ============================================================

export type Step = 'topic' | 'direction' | 'draft' | 'freeform';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type?: 'text' | 'topics' | 'direction' | 'draft' | 'error';
  data?: TopicResult | DirectionResult | DraftResult | ErrorData;
  timestamp: Date;
}

export interface Topic {
  num: number;
  title: string;
  angle: string;
  keywords: string[];
  difficulty: '입문' | '중급' | '고급';
  est_views: string;
}

export interface TopicResult {
  intro: string;
  topics: Topic[];
  tip: string;
}

export interface DirectionResult {
  summary: string;
  angle: string;
  target: string;
  hook: string;
  outline: { section: string; points: string[] }[];
  seo_keywords: string[];
  seo_score_estimate: number;
  confirm_question: string;
}

export interface DraftResult {
  meta_title: string;
  meta_desc: string;
  tags: string[];
  content: string;
  word_count: number;
  seo_tips: string[];
}

export interface ErrorData {
  errorMessage: string;
  retryMessage: string;
  retryStep: Step;
}

export interface Settings {
  categories: string[];
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  useSearch: boolean;
  useSeo: boolean;
  useFormat: boolean;
  length: 'short' | 'medium' | 'long';
}
