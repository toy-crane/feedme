# Pre-prompt 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 프롬프트 상태 위치 | FeedmePage 컴포넌트 내 useState | 기존 상태(url, result, error 등)와 같은 레벨에서 관리. 서버 저장 없음 |
| 프롬프트+마크다운 합침 로직 | 유틸리티 함수 `buildCopyText` | 복사, ChatGPT, Claude 3곳에서 동일 로직 사용. lib/utils.ts에 추가 |
| Collapsible 트리거 레이아웃 | 복사 버튼 아래 별도 줄 | 모바일에서 한 줄에 넣으면 overflow. wireframe 확정 |

## Data Model

### Prompt State (클라이언트)
- prompt: string (Textarea 값)
- promptOpen: boolean (Collapsible 열림 상태)
- selectedPreset: string | null (ToggleGroup 선택값)

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| shadcn | Task 1 | Collapsible, ToggleGroup 컴포넌트 설치 및 규칙 적용 |
| vercel-react-best-practices | Task 3, 4 | state 관리, 리렌더링 최적화 |
| vercel-composition-patterns | Task 3 | 컴포넌트 조합 구조 설계 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| components/ui/collapsible.tsx | 신규 | Task 1 |
| components/ui/toggle-group.tsx | 신규 | Task 1 |
| lib/utils.ts | 수정 | Task 3 |
| components/feedme-page.tsx | 수정 | Task 3, 4 |
| components/feedme-page.spec.test.tsx | 수정 | Task 2 |
| components/feedme-page.test.tsx | 수정 | Task 4 |

## Tasks

### Task 1: shadcn 컴포넌트 설치

- **시나리오**: PROMPT-003 (전제 조건)
- **의존성**: 없음
- **참조**:
  - shadcn — `collapsible`, `toggle-group` 설치
- **구현 대상**:
  - `components/ui/collapsible.tsx`
    - Collapsible, CollapsibleTrigger, CollapsibleContent export
  - `components/ui/toggle-group.tsx`
    - ToggleGroup, ToggleGroupItem export
- **수용 기준**:
  - [ ] `bunx --bun shadcn@latest add collapsible toggle-group` 성공
  - [ ] 두 컴포넌트 파일이 components/ui/에 생성됨

---

### Task 2: spec 테스트 작성

- **시나리오**: PROMPT-001 ~ PROMPT-011
- **의존성**: Task 1 (컴포넌트 import 필요)
- **참조**:
  - `components/feedme-page.spec.test.tsx` — 기존 spec 테스트 패턴 참조
- **구현 대상**:
  - `components/feedme-page.spec.test.tsx`
    - PROMPT-001: 콘텐츠 추출 후 "프롬프트 추가하기" 트리거 표시, 기본 접힘
    - PROMPT-002: 초기 화면에서 트리거 미표시
    - PROMPT-003: 트리거 클릭 시 Textarea + ToggleGroup 3개 칩 표시
    - PROMPT-004: 펼쳐진 상태에서 트리거 클릭 시 숨김
    - PROMPT-005: 프리셋 칩 클릭 시 Textarea에 텍스트 채움
    - PROMPT-006: 이미 선택된 칩 재클릭 시 Textarea 비움 + 선택 해제
    - PROMPT-007: Textarea 수정 시 칩 선택 자동 해제
    - PROMPT-008: 프롬프트 + 마크다운 합쳐서 복사, 빈 프롬프트면 마크다운만
    - PROMPT-009: ChatGPT/Claude URL query에 프롬프트 + 마크다운 합침
    - PROMPT-010: 다운로드 시 마크다운만 포함
    - PROMPT-011: 로고 클릭 시 프롬프트 초기화 + Collapsible 접힘
- **수용 기준**:
  - [ ] 모든 PROMPT-001 ~ PROMPT-011 시나리오에 대한 테스트 존재
  - [ ] `bun run test` 실행 시 모든 spec 테스트가 Red (아직 미구현)

---

### Task 3: buildCopyText 유틸리티 + 단위 테스트

- **시나리오**: PROMPT-008, PROMPT-009, PROMPT-010
- **의존성**: 없음
- **참조**:
  - vercel-react-best-practices — 순수 함수 분리
- **구현 대상**:
  - `lib/utils.ts`
    - `buildCopyText(prompt: string, markdown: string): string` 함수 추가
    - prompt가 비어있으면 markdown만 반환
    - prompt가 있으면 `${prompt}\n\n${markdown}` 반환
  - `lib/utils.test.ts`
    - buildCopyText 단위 테스트
- **수용 기준**:
  - [ ] `buildCopyText("요약해줘", "# Hello")` -> `"요약해줘\n\n# Hello"`
  - [ ] `buildCopyText("", "# Hello")` -> `"# Hello"`
  - [ ] `buildCopyText("  ", "# Hello")` -> `"# Hello"` (공백만 있으면 빈 것으로 처리)
  - [ ] `bun run test lib/utils.test.ts` 통과

---

### Task 4: FeedmePage에 프롬프트 UI 통합

- **시나리오**: PROMPT-001 ~ PROMPT-011
- **의존성**: Task 1 (컴포넌트), Task 2 (spec 테스트), Task 3 (buildCopyText)
- **참조**:
  - shadcn — Collapsible, ToggleGroup 사용법
  - vercel-composition-patterns — 컴포넌트 조합
  - `artifacts/pre-prompt/wireframe.html` — 확정된 레이아웃
- **구현 대상**:
  - `components/feedme-page.tsx`
    - state 추가: `prompt`, `promptOpen`, `selectedPreset`
    - handleReset에 프롬프트 상태 초기화 추가
    - 복사 버튼 행 (오른쪽 정렬, 별도 줄)
    - Collapsible 영역: (+) 프롬프트 추가하기 트리거 + chevron
    - CollapsibleContent: Textarea + ToggleGroup (3 프리셋)
    - 프리셋 선택 시 Textarea 채움, Textarea 수정 시 칩 선택 해제
    - handleCopy에서 buildCopyText 사용
    - SplitCopyButton에 prompt prop 전달, ChatGPT/Claude URL에 buildCopyText 적용
    - 다운로드는 기존대로 markdown만 사용
  - `components/feedme-page.test.tsx`
    - 프롬프트 UI 통합에 대한 구현 테스트
- **수용 기준**:
  - [ ] 콘텐츠 추출 후 "(+) 프롬프트 추가하기" 트리거 표시, 기본 접힘
  - [ ] 초기 화면(콘텐츠 미추출)에서 Collapsible 트리거 미표시
  - [ ] 트리거 클릭 시 Textarea + 3개 칩 표시/숨김, chevron 방향 전환 (접힘: right, 펼침: down)
  - [ ] 칩 클릭 -> Textarea 채움, 재클릭 -> 비움
  - [ ] Textarea 수정 -> 칩 선택 해제
  - [ ] 복사 시 프롬프트+마크다운 합침 (빈 프롬프트면 마크다운만)
  - [ ] ChatGPT/Claude URL에 프롬프트+마크다운 합침
  - [ ] 다운로드 시 마크다운만
  - [ ] 로고 클릭 시 프롬프트 초기화 + Collapsible 접힘
  - [ ] `bun run test` 전체 통과 (spec + 구현 테스트 모두 Green)

---

## 미결정 사항
없음
