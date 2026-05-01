# Zustand Store 타입 전체 (`lib/store.ts`)

```typescript
interface AgentStore {
  // 단계
  currentStep: number;               // 1~4

  // 대화
  messages: Message[];
  apiHistory: { role, content }[];

  // 주제 탐색
  topics: Topic[];
  selectedTopic: TopicEvaluation | null;  // 자동 선택된 단일 주제
  direction: DirectionResult | null;
  draft: DraftResult | null;

  // SEO 평가
  evaluations: TopicEvaluation[];    // 5개 평가 결과
  selectedTopics: TopicEvaluation[]; // 수동 2개 선택 (DualDraftBox용)
  selectionReason: string;
  drafts: DraftResult[];
  currentDraftIndex: number;

  // 이미지
  imagePrompts: ImagePrompt[];
  generatedImages: GeneratedImage[];
  isGeneratingImages: boolean;

  // UI 상태
  isLoading: boolean;
  isEvaluating: boolean;
  isPipelineRunning: boolean;

  // 모드 (localStorage persist)
  autoMode: boolean;

  // 설정
  settings: Settings;
}
```

- `reset()` 시 `settings`, `autoMode`만 보존. 나머지 전부 `INITIAL_STATE` 스프레드로 초기화.
- `persist`의 `partialize`로 `autoMode`만 localStorage 저장.
