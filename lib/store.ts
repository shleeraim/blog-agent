import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Message,
  Topic,
  TopicEvaluation,
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
  evaluations: [] as TopicEvaluation[],
  selectedTopics: [] as TopicEvaluation[],
  drafts: [] as DraftResult[],
  currentDraftIndex: 0,
  isEvaluating: false,
  isPipelineRunning: false,
  selectionReason: '',
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

  // 평가 결과
  evaluations: TopicEvaluation[];
  setEvaluations: (e: TopicEvaluation[]) => void;

  // 선택된 2개 주제
  selectedTopics: TopicEvaluation[];
  setSelectedTopics: (t: TopicEvaluation[]) => void;

  // 2개 초안 (순차 생성)
  drafts: DraftResult[];
  addDraft: (d: DraftResult) => void;
  clearDrafts: () => void;
  removeDraft: (index: number) => void;

  // 현재 작성 중인 초안 인덱스 (0 또는 1)
  currentDraftIndex: number;
  setCurrentDraftIndex: (i: number) => void;

  // 평가 로딩 상태
  isEvaluating: boolean;
  setIsEvaluating: (v: boolean) => void;

  // 자동 파이프라인 실행 중 여부
  isPipelineRunning: boolean;
  setIsPipelineRunning: (v: boolean) => void;

  // AI 선택 이유 (evaluate 응답)
  selectionReason: string;
  setSelectionReason: (r: string) => void;

  // 자동/수동 모드 (persist)
  autoMode: boolean;
  setAutoMode: (v: boolean) => void;

  // 전체 초기화 (settings, autoMode는 유지)
  reset: () => void;
}

// ──────────────────────────────────────────────
// ID 생성 헬퍼
// ──────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ──────────────────────────────────────────────
// Zustand Store (autoMode만 localStorage에 persist)
// ──────────────────────────────────────────────

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      settings: { ...DEFAULT_SETTINGS },
      autoMode: false,

      // ── Step ──
      setStep: (step) => set({ currentStep: step }),

      // ── Messages (화면 표시용) ──
      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...msg, id: generateId(), timestamp: new Date() },
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
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      // ── 로딩 ──
      setLoading: (isLoading) => set({ isLoading }),

      // ── 평가 결과 ──
      setEvaluations: (evaluations) => set({ evaluations }),

      // ── 선택된 주제 ──
      setSelectedTopics: (selectedTopics) => set({ selectedTopics }),

      // ── 다중 초안 ──
      addDraft: (draft) =>
        set((state) => ({ drafts: [...state.drafts, draft] })),
      clearDrafts: () => set({ drafts: [] }),
      removeDraft: (index) =>
        set((state) => ({ drafts: state.drafts.filter((_, i) => i !== index) })),

      // ── 초안 인덱스 ──
      setCurrentDraftIndex: (currentDraftIndex) => set({ currentDraftIndex }),

      // ── 평가 / 파이프라인 / 선택 이유 ──
      setIsEvaluating: (isEvaluating) => set({ isEvaluating }),
      setIsPipelineRunning: (isPipelineRunning) => set({ isPipelineRunning }),
      setSelectionReason: (selectionReason) => set({ selectionReason }),

      // ── 자동/수동 모드 ──
      setAutoMode: (autoMode) => set({ autoMode }),

      // ── 전체 초기화 (settings, autoMode는 보존) ──
      reset: () =>
        set((state) => ({
          ...INITIAL_STATE,
          settings: state.settings,
          autoMode: state.autoMode,
        })),
    }),
    {
      name: 'blog-agent-store',
      partialize: (state) => ({ autoMode: state.autoMode }),
    }
  )
);
