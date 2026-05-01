// ============================================================
// Blog Agent - Type Definitions
// ============================================================

export type Step = 'topic' | 'evaluate' | 'direction' | 'draft' | 'imagePrompts' | 'freeform';

export interface TopicEvaluation {
  rank: number;
  title: string;
  seo_score: number;
  search_volume: number;
  combined_score: number;
  seo_reason: string;
  volume_reason: string;
  selected: boolean;
}

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
  category: string;
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

export interface ImagePrompt {
  type: 'thumbnail' | 'content';
  aspectRatio: '16:9' | '1:1';
  prompt: string;                // Nano Banana 2에 전달할 영문 프롬프트
  altText: string;               // 마크다운 alt 텍스트 (한국어)
  insertAfterSection: string;    // 삽입 위치 (썸네일은 'header')
}

export interface GeneratedImage {
  type: 'thumbnail' | 'content';
  aspectRatio: '16:9' | '1:1';
  url: string;                   // base64 data URL 또는 저장 경로
  altText: string;
  insertAfterSection: string;
}

export interface Settings {
  categories: string[];
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  useSearch: boolean;
  useSeo: boolean;
  useFormat: boolean;
  length: 'short' | 'medium' | 'long';
}
