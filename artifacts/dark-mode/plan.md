# 다크 모드 토글 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 토글 위치 | 우측 상단 fixed | 스크롤 시에도 접근 가능, 콘텐츠 영역 비침범 |
| 토글 UI | Button + Sun/Moon 아이콘 | 2단 전환에 적합, 직관적 |
| 테마 관리 | next-themes (기존) | 이미 설치/설정됨, enableSystem만 변경 |
| 코드 하이라이팅 | .dark 클래스 선택자 분기 | 양쪽 CSS를 모두 로드하고 .dark 선택자로 활성화 전환, JS 불필요 |
| 컴포넌트 구조 | ThemeToggle 독립 컴포넌트 | layout.tsx에서 사용, feedme-page와 분리 |

## Data Model

해당 없음 (UI 전용 기능, next-themes가 localStorage 관리)

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| shadcn | Task 2 | Button 컴포넌트, lucide-react 아이콘 |
| next-best-practices | Task 2, Task 3 | 클라이언트 컴포넌트 경계, 하이드레이션 |
| vercel-react-best-practices | Task 2 | 상태 관리, 번들 최적화 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `components/theme-toggle.tsx` | 신규 | Task 2 |
| `app/layout.tsx` | 수정 | Task 3 |
| `components/feedme-page.tsx` | 수정 | Task 4 |
| `app/globals.css` | 수정 | Task 4 |

## Tasks

### Task 1: Spec 테스트 작성

- **시나리오**: DARK-001, DARK-002, DARK-003, DARK-004, DARK-005, DARK-006
- **의존성**: 없음
- **참조**:
  - `artifacts/spec.yaml` — dark-mode 시나리오
- **구현 대상**:
  - `components/__tests__/dark-mode.spec.test.tsx`
    - DARK-001: 토글 버튼 표시 및 fixed 위치 확인
    - DARK-002: 라이트 -> 다크 전환 확인
    - DARK-003: 다크 -> 라이트 전환 확인
    - DARK-004: OS 테마 자동 반영 확인
    - DARK-005: 테마 선택 유지 확인
    - DARK-006: 다크 모드 코드 하이라이팅 확인
- **수용 기준**:
  - [ ] `bun run test dark-mode.spec` 실행 시 6개 테스트가 모두 FAIL (Red 단계)

---

### Task 2: ThemeToggle 컴포넌트 구현

- **시나리오**: DARK-001, DARK-002, DARK-003
- **의존성**: Task 1 (테스트 먼저 작성)
- **참조**:
  - shadcn — Button, lucide-react icons
  - next-best-practices — client component boundary
- **구현 대상**:
  - `components/theme-toggle.tsx`
    - "use client" 클라이언트 컴포넌트
    - next-themes의 useTheme 훅 사용
    - Sun/Moon 아이콘 전환 (라이트: Sun, 다크: Moon)
    - Button variant="ghost" size="icon"
    - aria-label로 현재 테마 상태 안내
    - mounted 체크로 하이드레이션 불일치 방지
- **수용 기준**:
  - [ ] 토글 클릭 시 theme이 light <-> dark 전환된다
  - [ ] 라이트 모드에서 Sun 아이콘, 다크 모드에서 Moon 아이콘이 표시된다
  - [ ] `bun run test` — DARK-001, DARK-002, DARK-003 통과

---

### Task 3: ThemeProvider 설정 변경 및 토글 배치

- **시나리오**: DARK-001, DARK-004, DARK-005
- **의존성**: Task 2 (토글 컴포넌트 필요)
- **참조**:
  - next-best-practices — layout, hydration
- **구현 대상**:
  - `app/layout.tsx`
    - ThemeProvider의 `enableSystem={true}`로 변경
    - `defaultTheme="system"`으로 변경
    - ThemeToggle 컴포넌트를 fixed 위치로 배치
- **수용 기준**:
  - [ ] ThemeToggle이 화면 우측 상단에 fixed로 표시된다
  - [ ] 첫 방문 시 OS 다크 모드 -> html에 dark 클래스 적용
  - [ ] 첫 방문 시 OS 라이트 모드 -> html에 dark 클래스 없음
  - [ ] 다크 모드 전환 후 새로고침 시 다크 모드 유지
  - [ ] 라이트 모드 전환 후 새로고침 시 라이트 모드 유지
  - [ ] `bun run test` — DARK-001, DARK-004, DARK-005 통과

---

### Task 4: 다크 모드 코드 하이라이팅

- **시나리오**: DARK-006
- **의존성**: Task 3 (테마 전환 동작 필요)
- **참조**:
  - vercel-react-best-practices — 번들 최적화
- **구현 대상**:
  - `app/globals.css`
    - github.css와 github-dark.css를 모두 import
    - :root에서 github.css 활성화, .dark에서 github-dark.css 활성화 (CSS 선택자 분기)
  - `components/feedme-page.tsx`
    - 기존 `import "highlight.js/styles/github.css"` 제거 (globals.css로 이동)
- **수용 기준**:
  - [ ] 다크 모드에서 코드 블록이 어두운 배경 + 밝은 텍스트로 표시된다
  - [ ] 라이트 모드에서 기존 github.css 스타일이 유지된다
  - [ ] `bun run test` — DARK-006 포함 전체 통과

---

## 미결정 사항

없음
