# Decision Log — 2026-04-07

## 세션 요약

프롬프트 추가 섹션 UX 개선 → 코드 리팩토링 (God Component 분리) → 테스트 구조 개선

---

## 1. God Component 문제

### 문제
`feedme-page.tsx`(424줄)에 상태 관리, API 호출, UI 렌더링, 상수 정의, 서브 컴포넌트가 모두 혼재. CLAUDE.md의 아키텍처 규칙(types → config → lib → hooks → components)을 위반.

### 원인
- 기능 추가 시 기존 파일에 계속 코드를 추가하는 패턴
- 분리 시점에 대한 기준 부재
- CLAUDE.md에 아키텍처 계층 규칙은 있었지만, "언제 분리해야 하는가"에 대한 트리거 기준이 없었음

### 해결
5단계 bottom-up 분리:
1. `types/extract.ts` — 클라이언트 응답 타입
2. `config/presets.ts`, `lib/markdown-plugins.ts`, `components/icons.tsx` — 상수
3. `components/split-copy-button.tsx` — 서브 컴포넌트
4. `hooks/use-feedme.ts` — 상태 + 핸들러 훅
5. `components/url-input-section.tsx`, `prompt-editor.tsx`, `feedme-footer.tsx` — 프레젠테이션

결과: 424줄 → 116줄

### Harness 개선 포인트
- **CLAUDE.md에 파일 크기 경고 기준 추가 필요**: 예) "컴포넌트가 200줄을 초과하면 분리를 검토한다"
- **새 기능 추가 시 아키텍처 계층 체크 규칙**: "컴포넌트에 직접 useState가 3개 이상이면 커스텀 훅 추출을 검토한다"

---

## 2. 파일명이 역할을 반영하지 않는 문제

### 문제
`feedme-page.tsx`라는 이름은 페이지명 기반이라 컴포넌트의 역할(콘텐츠 추출)을 반영하지 않음.

### 원인
초기에 `app/page.tsx`에서 "use client" 경계를 분리할 때 관습적으로 페이지명을 사용

### 해결
`feedme-page.tsx` → `content-extractor.tsx`로 변경. 테스트 파일 6개의 import도 함께 수정.

### Harness 개선 포인트
- **CLAUDE.md에 네이밍 컨벤션 추가**: "컴포넌트 파일명은 역할 기반(content-extractor, url-input-section)으로 명명한다. 페이지명 기반(feedme-page, dashboard-page) 금지."

---

## 3. 단일 거대 훅 문제

### 문제
`useFeedme`(83줄)에 7개 state, 3개 handler, 2개 derived value가 혼재. URL 추출, 프롬프트 관리, 클립보드 복사라는 3가지 관심사가 섞여 있음.

### 해결
관심사별 3개 훅으로 분리:
- `useExtract` — URL 추출 (url, loading, error, result, markdownText)
- `usePrompt` — 프롬프트 (prompt, promptOpen, selectedPreset)
- `useClipboard` — 클립보드 (copied, handleCopy)
- `useFeedme` — 오케스트레이터 (기존 인터페이스 유지)

### Harness 개선 포인트
- **CLAUDE.md에 훅 분리 기준 추가**: "훅이 3개 이상의 독립적 관심사를 가지면 관심사별로 분리한다"

---

## 4. 테스트 파일 위치 불일치

### 문제
테스트가 3곳에 산재: `components/`, `components/__tests__/`, `__tests__/`. 어디에 새 테스트를 만들어야 하는지 기준 부재.

### 원인
git 히스토리 분석 결과, 프로젝트 진행 중 테스트 위치 컨벤션이 3번 바뀜:
- 초기: `__tests__/`에 feature별
- PR #2: `components/` 옆에
- PR #9: `components/__tests__/`

기존 파일을 마이그레이션하지 않은 채 새 컨벤션으로 파일을 추가함.

### 해결
모든 spec 테스트를 `__tests__/`로 통일. `components/__tests__/` 삭제.

### Harness 개선 포인트
- **CLAUDE.md에 이미 추가함**: spec 테스트는 `__tests__/`에 feature별, unit 테스트는 모듈 옆에
- **Hook 또는 Rule로 자동 검증 고려**: 새 `*.spec.test.tsx` 파일이 `__tests__/` 외 위치에 생성되면 경고

---

## 5. 거대 단일 테스트 파일 (1,034줄, 5개 feature 혼재)

### 문제
`content-extractor.spec.test.tsx`에 feedme-extract, pre-prompt, upgrade-logo, align-ui, improve-copy-button 5개 feature의 테스트가 한 파일에 존재.

### 원인
"이 컴포넌트의 테스트니까 이 파일에"라는 **컴포넌트 기준** 사고. 반면 나중에 추가된 feature(footer, rate-limit 등)는 처음부터 별도 파일로 생성됨. **분리 기준이 "feature별"인지 "컴포넌트별"인지 미정의**.

### 해결
feature별 4개 파일로 분리:
- `__tests__/feedme.spec.test.tsx` — 기존에 병합
- `__tests__/pre-prompt.spec.test.tsx`
- `__tests__/upgrade-logo.spec.test.tsx`
- `__tests__/align-ui.spec.test.tsx`

### Harness 개선 포인트
- **CLAUDE.md 규칙 명확화**: "spec 테스트 파일은 spec.yaml의 feature ID와 1:1 대응한다. 새 feature를 추가할 때 기존 파일에 describe 블록을 추가하지 않고 별도 파일을 생성한다."
- **Hook으로 자동 검증 고려**: spec 테스트 파일에 2개 이상의 최상위 describe가 있으면 경고

---

## 6. 헬퍼 함수 중복

### 문제
`renderWithContent`(spec)와 `renderWithExtractedContent`(unit)가 거의 동일한 함수. 다른 헬퍼도 스코프가 제각각 (describe 내부 vs 파일 최상위).

### 원인
spec 테스트와 unit 테스트가 같은 PR에서 별도 파일로 생성되면서 각자 독립적으로 헬퍼를 정의. 이후 통합 기회 없었음.

### 해결
`__tests__/helpers.tsx`에 공유 헬퍼 통합. 모든 테스트 파일에서 import.

### Harness 개선 포인트
- **CLAUDE.md 규칙 추가**: "테스트 헬퍼는 `__tests__/helpers.tsx`에 정의한다. 테스트 파일 내 로컬 헬퍼는 해당 파일에서만 사용되는 경우에만 허용."

---

## 7. spec/unit 테스트 중복

### 문제
`content-extractor.test.tsx`의 10개 테스트가 spec 테스트와 동일한 시나리오를 동일한 방식(전체 컴포넌트 렌더)으로 테스트. describe 이름에 spec ID(FEEDME-031 등)를 명시적으로 참조.

### 원인
CLAUDE.md에 `*.spec.test.tsx`와 `*.test.tsx`의 역할은 정의했지만, **"unit 테스트에서 무엇을 테스트해야 하는가"의 구체적 가이드라인 부재**. "spec은 수용 기준, unit은 구현 테스트"라는 추상적 구분만 있었음.

### 해결
- 중복 10개 테스트 제거
- 훅 3개(useExtract, usePrompt, useClipboard)에 대한 진짜 unit 테스트 16개 추가

### Harness 개선 포인트
- **CLAUDE.md 규칙 구체화**:
  ```
  ### unit 테스트 작성 기준
  - spec 테스트가 이미 커버하는 시나리오를 unit 테스트에서 반복하지 않는다
  - unit 테스트는 순수 로직(hooks, utils, services)을 renderHook/직접 호출로 테스트한다
  - 컴포넌트를 render()하는 테스트는 spec 테스트에서 담당한다
  ```

---

## 8. UX 피드백 반영 패턴

### 문제
프리셋 칩 탭 후 "이 프롬프트가 적용되는 건지" 시각적 피드백 없음. 프롬프트 초기화 수단 부재.

### 해결
- 복사 버튼 아래 "프롬프트 포함" 캡션 (상태 표시)
- Textarea 내 X 클리어 버튼 (InputGroup + InputGroupTextarea 활용)

### 과정에서 발견한 패턴
- 유저가 "옵션 제시해줘"라고 하면 3개 정도 제시하고 직감적 반응을 물어보는 것이 효과적
- 유저가 구체적 방향을 잡으면 바로 spec → 구현 순서로 진행
- Textarea 안 X 버튼이 일반적 패턴인지 리서치 → shadcn 기존 컴포넌트(InputGroup) 재활용 가능 확인

### Harness 개선 포인트
- 특별히 harness 변경 필요 없음. 기존 TDD 워크플로우가 잘 작동함.

---

## 요약: Harness 개선 우선순위

| 우선순위 | 개선 항목 | 적용 위치 |
|----------|----------|----------|
| **HIGH** | spec 테스트 = feature별 1파일, `__tests__/`에 통일 | CLAUDE.md |
| **HIGH** | unit 테스트에서 spec 시나리오 중복 금지, 순수 로직만 테스트 | CLAUDE.md |
| **HIGH** | 테스트 헬퍼는 `__tests__/helpers.tsx`에 통합 | CLAUDE.md |
| **MED** | 컴포넌트 200줄 초과 시 분리 검토 트리거 | CLAUDE.md |
| **MED** | 컴포넌트 파일명은 역할 기반 네이밍 | CLAUDE.md |
| **MED** | 새 feature 추가 시 기존 spec 파일에 describe 추가 금지 | CLAUDE.md / Hook |
| **LOW** | useState 3개 이상 시 커스텀 훅 추출 검토 | CLAUDE.md |
| **LOW** | spec 테스트 파일 위치 자동 검증 Hook | settings.json |
