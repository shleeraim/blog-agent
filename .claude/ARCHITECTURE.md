# 블로그 에이전트 — 아키텍처 상세

## 디렉토리 구조

```
blog-agent/
├── app/
│   ├── layout.tsx                  # 전체 레이아웃 (헤더 ModeToggle 포함)
│   ├── page.tsx                    # 메인 페이지 (6단계 파이프라인 오케스트레이터)
│   └── api/
│       ├── agent/route.ts          # Claude API 엔드포인트 (SSE 스트리밍)
│       ├── images/route.ts         # Gemini 이미지 생성 API
│       └── notes/route.ts          # Apple Notes 저장 API (AppleScript)
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageList.tsx         # 채팅 메시지 목록 (chat/ 하위)
│   │   └── cards/
│   │       ├── TopicsCard.tsx      # 주제 카드 (store 직접 구독)
│   │       ├── DirectionCard.tsx
│   │       ├── DraftCard.tsx
│   │       └── ErrorCard.tsx
│   ├── DraftBox.tsx                # 단일 초안 + 이미지 갤러리 (자동 파이프라인 결과)
│   ├── DualDraftBox.tsx            # 2개 초안 탭 UI (수동 모드 결과)
│   ├── ModeToggle.tsx              # 자동/수동 모드 토글 (헤더 우측)
│   ├── PipelineStatus.tsx          # 6단계 파이프라인 타임라인
│   ├── StepBar.tsx                 # 1→2→3→4 단계 진행 표시
│   ├── TopicCards.tsx              # Props 기반 주제 카드 (SEO 시각화 + 카운트다운)
│   └── ui/                         # shadcn 공용 컴포넌트
├── context/
│   └── ChatContext.tsx
├── hooks/
│   └── useChat.ts                  # 스트리밍 채팅 로직 (getState() 패턴)
└── lib/
    ├── store.ts                    # Zustand 전역 상태 (autoMode persist)
    ├── prompts.ts                  # Claude 시스템 프롬프트 6종
    ├── types.ts                    # TypeScript 타입 정의
    ├── utils.ts                    # cn(), extractJson()
    ├── image/
    │   ├── gemini-image.ts         # Gemini 이미지 생성 로직
    │   └── inject-images.ts        # 마크다운 본문에 이미지 삽입
    └── notes/
        └── apple-notes.ts          # AppleScript 기반 Notes 저장
```

---

## 에이전트 step 종류

| step | 역할 | 응답 방식 |
|------|------|---------|
| `topic` | 재테크 주제 5개 탐색 | SSE 스트리밍 |
| `evaluate` | 5개 주제 SEO 점수 평가, 상위 1개 자동 선택 | JSON (비스트리밍) SSE 래핑 |
| `direction` | 선택 주제의 글 방향성 설정 | SSE 스트리밍 |
| `draft` | SEO 최적화 블로그 초안 작성 | SSE 스트리밍 |
| `imagePrompts` | 초안 기반 이미지 생성 프롬프트 생성 | JSON (비스트리밍) SSE 래핑 |
| `freeform` | 완료 후 자유 대화 / 수정 요청 | SSE 스트리밍 |

`evaluate`와 `imagePrompts`는 `client.messages.create`(비스트리밍)로 처리 후 `{ type: 'delta', text } + { type: 'done' }` SSE 이벤트로 래핑. `useChat.ts`가 동일한 파서로 처리 가능.

---

## 자동 파이프라인 (`runAutoPipeline` in `app/page.tsx`)

```
사용자 입력 ("ETF 투자")
    ↓
Step 1 — topic: 주제 5개 탐색 (스트리밍)
    ↓
Step 2 — evaluate: SEO 점수 평가
         [실패 시 → setEvaluations([]) → 수동 선택 모드 전환, 파이프라인 중단]
    ↓
Step 3 — select: 종합점수 1위 자동 선택 → setSelectedTopic(selected) → 3초 대기
    ↓
Step 4 — direction + draft: 초안 생성 (스트리밍)
         [실패 시 → 파이프라인 중단]
    ↓
Step 5 — imagePrompts: 초안 기반 이미지 프롬프트 생성
         [실패 시 → 파이프라인 완료(이미지 없음)]
    ↓
Step 6 — images: /api/images 호출 → Gemini 이미지 생성
         [실패해도 파이프라인 계속 — 텍스트만 완성]
    ↓
완료 → setStep(4) → DraftBox 표시 (이미지 갤러리 + 본문)
```

**렌더 분기 (`page.tsx`)**:
- `drafts.length >= 1 && (imagePrompts.length > 0 || isGeneratingImages)` → `DraftBox` (자동 모드)
- `drafts.length >= 1 && 그 외` → `DualDraftBox` (수동 모드)

---

## 이미지 생성 흐름

```
getImagePromptsPrompt(content, metaTitle, category)
    → Claude가 { imagePrompts: [...] } JSON 반환
    → setImagePrompts(prompts) — store 저장

POST /api/images { imagePrompts }
    → generateImagesForDraft(prompts) — lib/image/gemini-image.ts
    → Gemini Imagen 3 API (gemini-3.1-flash-image-preview)
    → 성공: base64 data URL 반환 / 실패: 건너뜀
    → { images: GeneratedImage[], failedCount }

injectImagesIntoContent(content, images)  ← lib/image/inject-images.ts
    → insertAfterSection === 'header': 첫 ## 직전에 썸네일 삽입
    → 그 외: 해당 ## 섹션 다음 줄에 삽입
    → 매칭 실패 시 본문 끝에 추가
```

**이미지 재생성** (`handleRegenerateImage(promptIndex)`):
- `imagePrompts[promptIndex]`로 단일 이미지 재생성
- `type + insertAfterSection` 매칭으로 기존 이미지 교체 (없으면 append)

**수동 모드 이미지 생성** (`handleGenerateImages()`):
- 현재 `drafts[0]` 기반으로 imagePrompts 생성 후 이미지 생성 연속 실행

---

## 이미지 갤러리 UI (`DraftBox.tsx`)

| 상태 | 표시 |
|------|------|
| `isGeneratingImages` | 16:9 skeleton + 1:1 × 3 pulse skeleton + "🎨 이미지 생성 중..." |
| `imageError` | 오류 배너, 생성 버튼 숨김 |
| `imagePrompts` 있고 이미지 없음 | `FailurePlaceholder` - 회색 박스 + "생성 실패 — 재생성 버튼을 눌러주세요" |
| 이미지 있음 | 썸네일(전체 너비) + 본문용(140px 그리드) + 각 [🔄 재생성] 버튼 |
| 이미지 없고 오류 없음 | "[🎨 이미지 자동 생성]" 버튼 |

복사: `[🖼️ 이미지 포함 전체 복사]` → injectImagesIntoContent, 1MB 초과 시 경고 토스트 / `[📋 텍스트만 복사]`

---

## SEO 평가 시각화 (`TopicCards.tsx`)

Props 기반 (`selectionReason`은 store 직접 구독):
- `isEvaluating` 중: 카드 하단 pulse skeleton
- 평가 완료: SEO/검색량 점수 바 + 종합점수 배지 (80↑ 골드 / 60~79 실버)
- `selected: true` 카드: 골드 테두리 + `🏆 자동 선택` 배지 / 미선택: `opacity: 0.55`
- `selectionReason` 세팅 시 카운트다운 3→2→1 (useEffect 인터벌, 자동 숨김)

---

## PipelineStatus (`components/PipelineStatus.tsx`)

배열 기반 props. 전부 `waiting`이면 컴포넌트 자체 숨김.

```typescript
interface PipelineStep {
  id: string;
  label: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  detail?: string;
}
```

상태 아이콘: ⏳ waiting / 파란 스피너 running / ✓ 초록 done / ⚠ 주황 error

---

## useChat 훅 (`hooks/useChat.ts`)

`sendMessage` 내부에서 `useAgentStore.getState()` 패턴 → 의존성 `[]`, 파이프라인 순차 `await` 가능.

```typescript
sendMessage(userMessage, step, options?)
// options.noStepAdvance: true → setStep() 자동 호출 억제
// options.silent: true       → 유저 메시지 말풍선 숨기기
// options.extraPayload       → API body에 추가 필드 전송
```

step별 done 핸들러:
- `topic` → `setTopics` + 메시지 카드
- `evaluate` → `setEvaluations` + `setSelectionReason` + `setSelectedTopics`
- `direction` → `setDirection` + 메시지 카드
- `draft` → `setDraft` + 메시지 카드
- `imagePrompts` → `setImagePrompts` (메시지 없음)
- `freeform` → 텍스트 메시지

---

## 프롬프트 (`lib/prompts.ts`)

| 함수 | 역할 |
|------|------|
| `getTopicPrompt(settings)` | 주제 5개 탐색 |
| `getEvaluatePrompt(topics)` | SEO 평가, 종합점수 내림차순, 상위 2개 `selected: true` |
| `getDirectionPrompt(settings)` | 방향성 설정 |
| `getDraftPrompt(settings)` | 마크다운 초안 |
| `getImagePromptsPrompt(content, metaTitle, category)` | Gemini용 이미지 프롬프트 생성 |
| `getFreeformPrompt()` | 자유 대화 |

`getImagePromptsPrompt` 반환: `{ imagePrompts: [{ type, aspectRatio, prompt, altText, insertAfterSection }] }` — 썸네일 1장(16:9) + 본문용 2~3장(1:1).

---

## Apple Notes 저장 (`lib/notes/apple-notes.ts`)

```
POST /api/notes { draft, seoScore, searchVolume }
    → macOS 체크
    ↓ darwin: HTML 임시파일 → AppleScript 실행 (method: 'applescript')
    ↓ 그 외: method: 'clipboard'
    → noteTitle: "블로그 초안 YYYY-MM-DD" (같은 날 재실행 시 동일 노트 끝에 누적)
```

- `/usr/bin/osascript` 절대 경로 (Next.js 서버 환경 PATH 문제 방지)
- HTML 파일 → AppleScript 읽기 방식으로 특수문자 이스케이프 완전 회피

---

## 엣지 케이스 처리

| 상황 | 처리 |
|------|------|
| SEO 평가 실패 | `setEvaluations([])` → 카드 클릭 활성화 → 수동 선택 모드 |
| 초안 생성 실패 | 파이프라인 중단, error 토스트 |
| 이미지 프롬프트 실패 | images step도 error 표시, 텍스트만 완성 |
| 이미지 생성 실패 | 파이프라인 계속, DraftBox에 실패 placeholder 표시 |
| Gemini 키 미설정 | API 400 반환 → `imageError` 상태 → DraftBox 오류 배너 |
| 이미지 부분 실패 | 성공한 것만 표시, 실패 위치에 FailurePlaceholder + [🔄 재생성] |

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16.2.4 (App Router, Turbopack) |
| AI (텍스트) | Anthropic Claude Sonnet 4.6 (`@anthropic-ai/sdk ^0.90.0`) |
| AI (이미지) | Google Gemini Imagen 3 (`@google/generative-ai ^0.24.1`, 모델: `gemini-3.1-flash-image-preview`) |
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

- Apple Notes: Vercel에서 `process.platform !== 'darwin'` → `method: 'clipboard'` 폴백
- 이미지 생성: Vercel 함수 타임아웃(10초 기본) 주의
- 배포: `git add <파일> && git commit -m "변경 내용" && git push`
