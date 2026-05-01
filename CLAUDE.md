@AGENTS.md

# 블로그 에이전트

## 핵심 정보
- **경로**: `/Users/sanghwa/Documents/Tistory/blog-agent`
- **스택**: Next.js 16 App Router + Claude Sonnet API(SSE) + Gemini Imagen 3
- **실행**: `npx pnpm dev` (포트 3000)
- **배포**: push → Vercel 자동배포 (https://blog-agent-murex.vercel.app)
- **환경변수**: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (`.env.local` + Vercel)

## 아키텍처 요약
6단계 자동 파이프라인: topic → evaluate → select → direction+draft → imagePrompts → images
상태관리: Zustand (`lib/store.ts`) — `autoMode`만 persist, 나머지 세션마다 초기화
API: `app/api/agent/route.ts` (SSE), `images/`, `notes/`

## 핵심 주의사항
- `selectedTopic`: `TopicEvaluation | null` — `rank` 필드 사용 (`num` 아님)
- `TopicsCard.tsx`(store 연결) ≠ `TopicCards.tsx`(props 기반) — 혼동 주의
- `@radix-ui/react-tabs` 미설치 — Tabs는 커스텀 state로 구현
- direction+draft 전 반드시 `clearApiHistory()` + `setDraft(null)` 호출
- `pnpm build` 전 TypeScript 오류 확인 필수

## 참고 문서 (필요 시 요청)
- 전체 구조/흐름: `.claude/ARCHITECTURE.md`
- Zustand 타입 전체: `.claude/STORE.md`
- ETF 계산기: `/Users/sanghwa/Documents/Tistory/etf-calculator/` (별도 앱, 포트 3001)
