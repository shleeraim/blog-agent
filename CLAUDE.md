@AGENTS.md

---

# 블로그 에이전트 프로젝트 정리

## 프로젝트 개요

재테크 블로그 글 작성을 자동화하는 AI 에이전트. Claude Sonnet API를 백엔드로 사용하며, Next.js 16 App Router 기반 웹앱이다.

핵심 기능: 주제 탐색 → SEO 평가 → 자동 선택 → 2개 초안 순차 생성 → Apple Notes 자동 저장까지 원클릭으로 완주하는 **자동 파이프라인**.

**헤더 토글로 자동/수동 전환**: 🚀 자동 모드(파이프라인) ↔ 🔧 수동 모드(단계별 진행). 설정은 새로고침 후에도 유지됨(localStorage persist).

**별도 분리된 앱**: ETF 계산기는 `/Users/sanghwa/Documents/Tistory/etf-calculator/`에 독립 프로젝트로 존재한다. 두 앱은 상태를 공유하지 않는다.

---

## 실행 방법

```bash
# 블로그 에이전트 (포트 3000)
cd /Users/sanghwa/Documents/Tistory/blog-agent
npx pnpm dev

# ETF 계산기 (포트 3001) — 별도 터미널에서
cd /Users/sanghwa/Documents/Tistory/etf-calculator
npx pnpm dev
```

빌드 확인: `npx pnpm build`

---

## 디렉토리 구조

```
blog-agent/
├── app/
│   ├── layout.tsx                  # 전체 레이아웃 (헤더 ModeToggle 포함)
│   ├── page.tsx                    # 메인 페이지 (파이프라인 오케스트레이터)
│   └── api/
│       ├── agent/route.ts          # Claude API 엔드포인트 (스트리밍 + evaluate JSON)
│       └── notes/route.ts          # Apple Notes 저장 API (AppleScript 실행)
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx           # 메시지 입력창 (placeholder 오버라이드 지원)
│   │   ├── MessageBubble.tsx       # 메시지 말풍선
│   │   ├── MessageList.tsx         # 채팅 메시지 목록
│   │   └── cards/
│   │       ├── TopicsCard.tsx      # 주제 카드 + SEO 점수 바 + 자동선택 배지
│   │       ├── DirectionCard.tsx   # 방향성 결과 카드
│   │       ├── DraftCard.tsx       # 단일 초안 결과 카드
│   │       └── ErrorCard.tsx
│   ├── DualDraftBox.tsx            # 2개 초안 탭 UI (비교표 + 액션 버튼)
│   ├── ModeToggle.tsx              # 자동/수동 모드 토글 (헤더 우측)
│   ├── PipelineStatus.tsx          # 파이프라인 진행 타임라인 (6단계)
│   ├── StepBar.tsx                 # 1→2→3→4 단계 진행 표시
│   ├── TopicCards.tsx              # (레거시, 직접 사용 안 함)
│   ├── DraftBox.tsx                # (레거시, 직접 사용 안 함)
│   └── ui/                         # shadcn 스타일 공용 컴포넌트
├── context/
│   └── ChatContext.tsx             # sendMessage, isLoading 전역 공유
├── hooks/
│   └── useChat.ts                  # 스트리밍 채팅 로직 (getState() 패턴)
└── lib/
    ├── store.ts                    # Zustand 전역 상태 (autoMode persist)
    ├── prompts.ts                  # Claude 시스템 프롬프트 5종
    ├── types.ts                    # TypeScript 타입 정의
    ├── utils.ts                    # cn() 유틸
    └── notes/
        └── apple-notes.ts          # AppleScript 기반 Notes 저장 로직
```

---

## 핵심 로직 흐름

### 1. 에이전트 단계

| step 값 | 역할 | 응답 방식 |
|---------|------|---------|
| `topic` | 재테크 주제 5개 탐색 | SSE 스트리밍 |
| `evaluate` | 5개 주제 SEO 점수 평가, 상위 2개 자동 선택 | 단순 JSON (비스트리밍) |
| `direction` | 선택 주제의 글 방향성 설정 | SSE 스트리밍 |
| `draft` | SEO 최적화 블로그 초안 작성 | SSE 스트리밍 |
| `freeform` | 완료 후 자유 대화 / 수정 요청 | SSE 스트리밍 |

### 2. 자동 파이프라인 (`runAutoPipeline` in `app/page.tsx`)

```
사용자 입력 ("ETF 투자")
    ↓
Step 1 — topic: 주제 5개 탐색 (스트리밍)
    ↓
Step 2 — evaluate: SEO 점수 평가 → 상위 2개 자동 선택 → 3초 대기
    ↓                [실패 시 → 수동 선택 모드 전환, 파이프라인 중단]
Step 3 — direction + draft: 1번 주제 → 초안 생성 (스트리밍)
    ↓     → Apple Notes 자동 저장 (POST /api/notes)
    ↓                [생성 실패 시 → 해당 단계 'failed', 2번으로 진행]
Step 4 — direction + draft: 2번 주제 → 초안 생성 (스트리밍)
    ↓     → Apple Notes 자동 저장
    ↓
완료 → DualDraftBox 표시 (탭 UI + 비교표), setStep(4)
```

각 direction+draft 쌍 사이에 `clearApiHistory()` + `setDraft(null)` 호출 → 독립된 컨텍스트.
`noStepAdvance: true` 옵션으로 중간 step 변경 억제.

### 3. 자동/수동 모드 (`autoMode` in store)

- `autoMode: true` + 새 세션: 사용자 입력 즉시 `runAutoPipeline()` 실행
- `autoMode: false`: 기존 단계별 수동 진행
- Zustand `persist` 미들웨어로 localStorage에 저장 → 새로고침 후 유지
- 모드 전환 시 현재 세션 자동 초기화 (`reset()` + `clearDrafts()`)

### 4. 엣지 케이스 처리

| 상황 | 처리 방식 |
|------|---------|
| SEO 평가 실패 | evaluations 초기화 → 카드 클릭 활성화 → 채팅에 "수동 선택 모드" 메시지 표시 |
| 1번/2번 초안 생성 실패 | `draft: 'failed'` 표시, 메시지 "생성 실패 — 다음으로 진행", 파이프라인 계속 |
| Apple Notes 저장 실패 | `notes: 'failed'` 표시, 경고 메시지, 파이프라인 중단 없이 계속 |
| 모든 실패 | `setDraft(null)` 초기화 덕분에 이전 초안이 오염되지 않음 |

### 5. Apple Notes 저장 (`lib/notes/apple-notes.ts`)

```
POST /api/notes { draft, seoScore, searchVolume }
    ↓
saveToAppleNotes() — macOS 체크
    ↓ (darwin)                    ↓ (그 외)
HTML 본문 → 임시 파일 저장        method: 'clipboard' 반환
AppleScript 임시 파일 실행         (클라이언트에서 clipboard 처리)
    ↓ 성공                ↓ 실패
method: 'applescript'   method: 'clipboard'
noteTitle: "블로그 초안 YYYY-MM-DD"
    ↓
같은 날 재실행 → 동일 노트 끝에 누적 추가
```

- 본문을 HTML 파일로 먼저 저장 후 AppleScript에서 읽음 → 특수문자 이스케이프 문제 완전 회피
- `/usr/bin/osascript` 절대 경로 사용 — Next.js 서버 환경의 PATH 문제 방지
- 임시 파일 2개 (HTML + .applescript) 실행 후 자동 삭제

### 6. 스트리밍 API (`app/api/agent/route.ts`)

- `step === 'evaluate'`: 비스트리밍 JSON 응답 `{ evaluations: [], selection_reason: "" }`
- 나머지 step: SSE 스트리밍 `data: { type: 'delta'|'done'|'error', ... }`
- `useSearch` 설정 시 `topic` / `draft` step에 `web_search` 툴 포함

### 7. useChat 훅 (`hooks/useChat.ts`)

`sendMessage` 내부에서 `useAgentStore.getState()`를 사용하여 항상 최신 상태를 읽는다.
의존성 배열 `[]` → 안정적인 함수 참조. 파이프라인에서 순차 `await` 호출 가능.

```typescript
sendMessage(userMessage, step, options?)
// options.noStepAdvance: true → setStep() 자동 호출 억제
// options.silent: true       → 유저 메시지 말풍선 숨기기
```

### 8. 상태 관리 (`lib/store.ts`)

```typescript
interface AgentStore {
  // 단계
  currentStep: number;               // 1~4

  // 대화
  messages: Message[];
  apiHistory: { role, content }[];

  // 단계별 데이터
  topics: Topic[];                   // 탐색된 5개 주제
  selectedTopic: Topic | null;
  direction: DirectionResult | null;
  draft: DraftResult | null;         // 파이프라인 각 단계 전에 null로 초기화

  // 평가 파이프라인
  evaluations: TopicEvaluation[];    // evaluate 결과 5개
  selectedTopics: TopicEvaluation[]; // selected: true인 2개
  selectionReason: string;           // AI 선택 이유 문장
  drafts: DraftResult[];             // 완성된 초안 배열 (최대 2개)
  currentDraftIndex: number;

  // UI 상태
  isLoading: boolean;
  isEvaluating: boolean;             // evaluate API 호출 중 (TopicsCard 스켈레톤)
  isPipelineRunning: boolean;        // 전체 파이프라인 실행 중 (입력창 비활성)

  // 모드 (localStorage에 persist)
  autoMode: boolean;

  // 설정
  settings: Settings;
}
```

### 9. 프롬프트 (`lib/prompts.ts`)

| 함수 | 역할 |
|------|------|
| `getTopicPrompt(settings)` | 주제 5개 탐색, JSON 출력 |
| `getEvaluatePrompt(topics, categories)` | 5개 주제 SEO 평가, 종합점수 내림차순 정렬, 상위 2개 `selected: true` |
| `getDirectionPrompt(settings)` | 방향성 설정 (제목/소제목/톤/SEO 키워드) |
| `getDraftPrompt(settings)` | 마크다운 초안 + meta_title + tags |
| `getFreeformPrompt()` | 자유 대화 / 수정 요청 처리 |

**evaluate 평가 기준**: SEO 점수(×0.6) + 검색량 지수(×0.4) = 종합점수

---

## UI 컴포넌트 상세

### ModeToggle (`components/ModeToggle.tsx`)

헤더 우측 슬라이드 토글. 🚀 자동 / 🔧 수동 전환.
- 파이프라인 실행 중 비활성화
- 전환 시 `reset()` + `clearDrafts()` 호출 → 세션 초기화

### TopicsCard (`components/chat/cards/TopicsCard.tsx`)

store에서 `evaluations`, `isEvaluating`, `isPipelineRunning`, `selectionReason`을 직접 구독.

- `isEvaluating` 중: 각 카드 하단에 pulse 스켈레톤
- 평가 완료 후: SEO / 검색량 점수 바 + 종합점수 큰 숫자
- `selected: true` 카드: 골드 테두리 2px + "✅ 자동 선택" 배지
- 미선택 카드: `opacity: 0.45`
- `isPipelineRunning` 중 또는 `hasEval` 시: 클릭 비활성 (평가 실패 후 evaluations 초기화되면 재활성)

### PipelineStatus (`components/PipelineStatus.tsx`)

파이프라인 실행 중에만 렌더링. 6단계 + `failed` 상태 지원.

```
🔍 주제 탐색           ✅ 완료
📊 SEO 평가            ✅ 완료 — 제목A · 제목B
✍️ 1번 초안 작성        ✅ 완료
🍎 1번 Apple Notes 저장 🔄 진행 중...
✍️ 2번 초안 작성        ⏳ 대기
🍎 2번 Apple Notes 저장 ⏳ (idle 시 숨김)
```

상태값: `idle` / `running`(스피너) / `done`(✓ 초록) / `failed`(⚠ 주황)  
`stepMessages` prop으로 단계별 커스텀 경고 메시지 전달 가능.

### DualDraftBox (`components/DualDraftBox.tsx`)

`drafts.length >= 1`이면 MessageList 대신 렌더링.

**구성:**
- 완료 배너 (2개 완성 시)
- 비교 요약 테이블: SEO 점수 / 검색량 / 종합점수 / 글자 수 (2개 완성 후)
- 탭 UI: ① 1번 초안 / ② 2번 초안 (완성 여부에 따라 스피너 or 체크)
- 2번 완성 시 탭 자동 전환 (400ms 딜레이)
- 탭별 버튼: 이 초안 복사 / Apple Notes 저장(API 호출) / 이 초안 재작성
- 공통 버튼: 두 초안 모두 복사 / 새 주제 (AlertDialog 확인)
- Apple Notes 버튼: 로딩 스피너 → 성공/실패/클립보드 폴백 토스트

**Draft2Loading**: 2번 초안 생성 중 `streamingText` 실시간 표시 + pulse 스켈레톤

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16.2.4 (App Router, Turbopack) |
| AI | Anthropic Claude Sonnet 4.6 (`@anthropic-ai/sdk ^0.90.0`) |
| 상태관리 | Zustand 5.x + persist 미들웨어 |
| 스타일 | Tailwind v4 + 인라인 스타일 (다크 테마 `#0d1117`) |
| UI 컴포넌트 | Radix UI 기반 shadcn (Tabs 미설치 — 커스텀 구현) |
| 마크다운 | react-markdown ^10 |
| 토스트 | sonner ^2 |
| 패키지 매니저 | pnpm |
| macOS 통합 | child_process + AppleScript (로컬 전용) |

---

## 배포 정보

| 항목 | 내용 |
|------|------|
| 서비스 URL | https://blog-agent-murex.vercel.app |
| GitHub 레포 | https://github.com/shleeraim/blog-agent |
| 배포 플랫폼 | Vercel (무료 플랜) |
| 배포 방식 | GitHub main 브랜치에 push하면 자동 재배포 |

### 환경 변수

- 로컬: `.env.local`에 `ANTHROPIC_API_KEY` 설정
- Vercel: 대시보드 → blog-agent → Settings → Environment Variables에 `ANTHROPIC_API_KEY` 설정

### Vercel 배포 시 Apple Notes 비활성화

`lib/notes/apple-notes.ts`는 `process.platform !== 'darwin'` 체크로 자동 비활성화.
Vercel(Linux)에서는 `method: 'clipboard'`를 반환 → 클라이언트에서 클립보드 복사로 폴백.

### 코드 수정 후 배포 절차

```bash
git add <수정한 파일>
git commit -m "변경 내용"
git push
```

---

## 주의사항

- `@radix-ui/react-tabs` 미설치 — Tabs는 `DualDraftBox.tsx` 내 커스텀 state로 구현
- `react-markdown` Components prop의 `children`은 `React.ReactNode | undefined` (optional) — `required`로 선언 시 TypeScript 오류
- `useChat`의 `sendMessage`는 `[]` 의존성 + `getState()` 패턴 → 파이프라인 순차 await 가능
- 파이프라인 각 direction+draft 쌍 전에 `clearApiHistory()` + `setDraft(null)` 호출 필수
- `pnpm build` 전에 반드시 TypeScript 오류 없는지 확인
- Apple Notes API는 `/usr/bin/osascript` 절대 경로 사용 — PATH 다른 환경에서 `osascript`만 쓰면 실패
- Zustand `persist`는 `autoMode` 필드만 선택적으로 저장 (`partialize` 옵션) — 나머지 상태는 매 세션마다 초기화
- 블로그 에이전트와 ETF 계산기는 완전히 분리된 프로세스 — 동시에 실행 시 터미널 두 개 필요
- Next.js가 포트 3000 사용 중이면 자동으로 3001로 올라감 → 에이전트를 먼저 3000번으로 기동한 뒤 계산기 실행
