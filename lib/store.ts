import { create } from 'zustand';
import type {
  Message,
  Topic,
  DirectionResult,
  DraftResult,
  Settings,
} from '@/lib/types';

// ──────────────────────────────────────────────
// 초기값
// ──────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  categories: ['ETF/펀드', '예금/적금', '부동산', '주식', 'ISA/연금', '절세', '해외투자'],
  level: 'all',
  useSearch: true,
  useSeo: true,
  useFormat: true,
  length: 'medium',
};

const INITIAL_STATE = {
  currentStep: 1,
  messages: [] as Message[],
  apiHistory: [] as { role: 'user' | 'assistant'; content: string }[],
  topics: [] as Topic[],
  selectedTopic: null as Topic | null,
  direction: null as DirectionResult | null,
  draft: null as DraftResult | null,
  isLoading: false,
};

// ──────────────────────────────────────────────
// Store Interface
// ──────────────────────────────────────────────

interface AgentStore {
  // 단계 (1=주제탐색, 2=방향확정, 3=글작성, 4=완료)
  currentStep: number;
  setStep: (step: number) => void;

  // 대화 히스토리 (화면 표시용)
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Anthropic API 전송용 히스토리
  apiHistory: { role: 'user' | 'assistant'; content: string }[];
  addApiHistory: (role: 'user' | 'assistant', content: string) => void;
  clearApiHistory: () => void;

  // 단계별 데이터
  topics: Topic[];
  setTopics: (t: Topic[]) => void;
  selectedTopic: Topic | null;
  setSelectedTopic: (t: Topic | null) => void;
  direction: DirectionResult | null;
  setDirection: (d: DirectionResult | null) => void;
  draft: DraftResult | null;
  setDraft: (d: DraftResult | null) => void;

  // 설정
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;

  // 로딩
  isLoading: boolean;
  setLoading: (v: boolean) => void;

  // 전체 초기화 (settings는 유지)
  reset: () => void;
}

// ──────────────────────────────────────────────
// ID 생성 헬퍼
// ──────────────────────────────────────────────

function generateId(): string {
  // crypto.randomUUID()는 브라우저/Node.js 18+ 모두 지원
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback: timestamp + random
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ──────────────────────────────────────────────
// Zustand Store
// ──────────────────────────────────────────────

export const useAgentStore = create<AgentStore>((set) => ({
  ...INITIAL_STATE,
  settings: { ...DEFAULT_SETTINGS },

  // ── Step ──
  setStep: (step) => set({ currentStep: step }),

  // ── Messages (화면 표시용) ──
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: generateId(),
          timestamp: new Date(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),

  // ── API History (Anthropic 전송용) ──
  addApiHistory: (role, content) =>
    set((state) => ({
      apiHistory: [...state.apiHistory, { role, content }],
    })),

  clearApiHistory: () => set({ apiHistory: [] }),

  // ── 단계별 데이터 ──
  setTopics: (topics) => set({ topics }),
  setSelectedTopic: (selectedTopic) => set({ selectedTopic }),
  setDirection: (direction) => set({ direction }),
  setDraft: (draft) => set({ draft }),

  // ── 설정 (부분 업데이트) ──
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  // ── 로딩 ──
  setLoading: (isLoading) => set({ isLoading }),

  // ── 전체 초기화 (settings는 보존) ──
  reset: () =>
    set((state) => ({
      ...INITIAL_STATE,
      settings: state.settings, // 사용자 설정 유지
    })),
}));
