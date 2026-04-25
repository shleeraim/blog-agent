@AGENTS.md

---

# 블로그 에이전트 프로젝트 정리

## 프로젝트 개요

재테크 블로그 글 작성을 자동화하는 AI 에이전트. Claude Sonnet API를 백엔드로 사용하며, Next.js 16 App Router 기반 웹앱이다.

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
│   ├── layout.tsx          # 전체 레이아웃 (헤더 + 3단 컬럼 + 모바일)
│   ├── page.tsx            # 메인 채팅 페이지
│   └── api/agent/
│       └── route.ts        # Claude API 스트리밍 엔드포인트
├── components/
│   ├── layout/
│   │   ├── HeaderNav.tsx   # 상단 내비게이션
│   │   ├── LeftSidebar.tsx # 좌측 사이드바 (세션 관리)
│   │   ├── RightPanel.tsx  # 우측 패널 (키워드 등)
│   │   └── MobileLayout.tsx
│   ├── chat/
│   │   ├── ChatInput.tsx   # 메시지 입력창
│   │   ├── MessageBubble.tsx
│   │   ├── MessageList.tsx
│   │   └── cards/
│   │       ├── TopicsCard.tsx    # 주제 추천 결과 카드
│   │       ├── DirectionCard.tsx # 방향성 결과 카드
│   │       ├── DraftCard.tsx     # 초안 결과 카드
│   │       └── ErrorCard.tsx
│   ├── DraftBox.tsx        # 완성된 초안 표시 (복사, 수정, 리셋)
│   ├── DirectionPanel.tsx
│   ├── InputBar.tsx
│   ├── MessageList.tsx
│   ├── RightPanel.tsx
│   ├── Sidebar.tsx
│   ├── StepBar.tsx         # 1→2→3단계 진행 표시
│   ├── TopicCards.tsx
│   └── ui/                 # 공용 UI 컴포넌트 (shadcn 스타일)
├── context/
│   └── ChatContext.tsx     # sendMessage, isLoading 전역 공유
├── hooks/
│   └── useChat.ts          # 스트리밍 채팅 로직
└── lib/
    ├── store.ts            # Zustand 전역 상태 (messages, currentStep 등)
    ├── prompts.ts          # Claude 시스템 프롬프트 (topic/direction/draft)
    ├── types.ts            # TypeScript 타입 정의
    └── utils.ts            # cn() 유틸
```

---

## 핵심 로직 흐름

### 1. 에이전트 3단계

| 단계 | step 값 | 역할 |
|------|---------|------|
| 1단계 | `topic` | 재테크 주제 3개 추천 |
| 2단계 | `direction` | 선택한 주제의 글 방향성 설정 |
| 3단계 | `draft` | SEO 최적화 블로그 초안 작성 |
| 자유 | `freeform` | 3단계 이후 자유 대화 |

### 2. 스트리밍 API

- `POST /api/agent` — `{ message, step, history }` 를 받아 Claude API 스트리밍 응답 반환
- 응답은 JSON (`{ type: 'topics'|'direction'|'draft'|'text', ... }`) 형태로 파싱
- `useChat.ts`가 SSE 스트림을 읽고 `onStreamDelta` 콜백으로 실시간 렌더링

### 3. 상태 관리 (Zustand — `lib/store.ts`)

```typescript
interface AgentStore {
  currentStep: number;        // 1~4
  messages: Message[];        // 전체 대화 기록
  addMessage: (m) => void;
  setStep: (n) => void;
  reset: () => void;
}
```

### 4. 프롬프트 (`lib/prompts.ts`)

- `topicPrompt` — 주제 3개 추천, JSON 배열 출력
- `directionPrompt` — 방향성 설정, 제목/소제목/톤 등 JSON 출력
- `draftPrompt` — 마크다운 초안 + meta_title + tags JSON 출력

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16.2.4 (App Router, Turbopack) |
| AI | Anthropic Claude Sonnet (`@anthropic-ai/sdk`) |
| 상태관리 | Zustand 5.x |
| 스타일 | Tailwind v4 + 인라인 스타일 (다크 테마 `#0d1117`) |
| UI 컴포넌트 | Radix UI 기반 shadcn 스타일 |
| 마크다운 | react-markdown |
| 토스트 | sonner |
| 패키지 매니저 | pnpm |

---

## ETF 계산기 (별도 앱 요약)

위치: `/Users/sanghwa/Documents/Tistory/etf-calculator/`
포트: 3001

기능:
- 적립식(DCA) / 거치식(Lump Sum) / 배당 재투자 / ETF 비교 4개 탭
- Recharts 기반 성장 차트, 수익 구성 차트, 절세 비교 차트, ETF 비교 차트
- 연도별 상세 테이블 (CSV 내보내기)
- 결과 이미지 PNG 저장 (html2canvas)
- 티스토리 위젯 HTML 다운로드 (`public/widget/etf-calculator-widget.html`)
- 11개 ETF 프리셋 (TIGER S&P500, ACE QQQ, KODEX 배당커버드콜 등)
- 세금 유형: 일반 15.4% / ISA 일반 9.9% / ISA 근로자 9.9% / 연금저축 3.3%

---

## 주요 의존성

```json
{
  "@anthropic-ai/sdk": "^0.90.0",
  "next": "16.2.4",
  "react": "19.2.4",
  "zustand": "^5.0.12",
  "recharts": "^3.8.1",
  "react-markdown": "^10.1.0",
  "sonner": "^2.0.7"
}
```

---

## 주의사항

- `.env.local`에 `ANTHROPIC_API_KEY` 필요
- `pnpm build` 전에 반드시 TypeScript 오류 없는지 확인
- 블로그 에이전트와 ETF 계산기는 완전히 분리된 프로세스 — 동시에 실행 시 터미널 두 개 필요
- Next.js가 포트 3000 사용 중이면 자동으로 3001로 올라감 → 계산기 포트 충돌 발생하므로 에이전트를 먼저 3000번으로 기동한 뒤 계산기 실행
