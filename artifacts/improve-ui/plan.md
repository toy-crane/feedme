# improve-ui 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| GFM 지원 | remark-gfm | react-markdown 공식 권장 플러그인, 취소선/테이블/태스크리스트/자동링크 일괄 지원 |
| 코드 하이라이팅 | rehype-highlight | 경량, CSS 테마 기반, highlight.js 호환. shiki 대비 번들 크기 작음 |
| 레이아웃 구조 | 제목+복사 버튼 한 줄 | wireframe 확정안. "미리보기" 라벨 제거, 구분선으로 Form과 콘텐츠 분리 |

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| shadcn | Task 3 | 컴포넌트 스타일 변경 시 shadcn 규칙 준수 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `package.json` | 수정 | Task 1 |
| `__tests__/improve-ui.spec.test.tsx` | 신규 | Task 2 |
| `components/feedme-page.tsx` | 수정 | Task 3, 4, 5 |

변경 유형: 신규 | 수정 | 삭제

## Tasks

### Task 1: remark-gfm, rehype-highlight 패키지 설치

- **시나리오**: FEEDME-014 ~ FEEDME-019 (전제 조건)
- **의존성**: 없음
- **구현 대상**:
  - `package.json`
    - `remark-gfm` 의존성 추가
    - `rehype-highlight` 의존성 추가
- **수용 기준**:
  - [ ] `bun install` 성공
  - [ ] `import remarkGfm from 'remark-gfm'` 가 에러 없이 동작
  - [ ] `import rehypeHighlight from 'rehype-highlight'` 가 에러 없이 동작

---

### Task 2: spec 테스트 작성

- **시나리오**: FEEDME-010 ~ FEEDME-019
- **의존성**: Task 1 (플러그인 import 필요)
- **구현 대상**:
  - `__tests__/improve-ui.spec.test.tsx`
    - FEEDME-010: 웹페이지 미리보기에 max-height가 없음
    - FEEDME-011: YouTube 자막에 max-height가 없음
    - FEEDME-012: 미리보기 영역에 border가 없음
    - FEEDME-013: 콘텐츠 영역 max-w-2xl 이상
    - FEEDME-014: ~~취소선~~ → `<del>` 렌더링
    - FEEDME-015: 테이블 → `<table>` 렌더링
    - FEEDME-016: 태스크리스트 → 체크박스 렌더링
    - FEEDME-017: 언어 지정 코드 블록 → 하이라이팅 클래스 존재
    - FEEDME-018: 자동 링크 → `<a>` 렌더링
    - FEEDME-019: 언어 미지정 코드 블록 → 하이라이팅 클래스 없음
- **수용 기준**:
  - [ ] `bun run test __tests__/improve-ui.spec.test.tsx` 실행 시 모든 테스트가 Red (실패)

---

### Task 3: 레이아웃 변경 (너비 확대, 높이/테두리 제거, 구조 변경)

- **시나리오**: FEEDME-010, FEEDME-011, FEEDME-012, FEEDME-013
- **의존성**: Task 2 (테스트가 먼저 존재해야 함)
- **참조**:
  - shadcn — 컴포넌트 스타일 규칙
- **구현 대상**:
  - `components/feedme-page.tsx`
    - 콘텐츠 영역 `max-w-lg` → `max-w-2xl`
    - 웹페이지 미리보기: `max-h-96`, `border`, `rounded-md` 제거
    - YouTube 자막: `max-h-60`, `border`, `rounded-md` 제거
    - Form과 콘텐츠 사이 구분선(`<hr>` 또는 `<Separator>`) 추가
    - "미리보기"/"자막" 라벨 제거
    - 웹페이지: 추출된 제목 + 복사 버튼을 한 줄에 배치 (flex, justify-between)
    - YouTube: 썸네일 유지, 제목 + 복사 버튼을 한 줄에 배치, 채널명 아래 표시
    - 제목 아래 설명/채널명 표시 후 여백으로 본문과 분리
- **수용 기준**:
  - [ ] FEEDME-010 테스트 통과: 웹페이지 미리보기에 max-height 없음
  - [ ] FEEDME-011 테스트 통과: YouTube 자막에 max-height 없음
  - [ ] FEEDME-012 테스트 통과: border 없음
  - [ ] FEEDME-013 테스트 통과: max-w-2xl 적용

---

### Task 4: GFM 플러그인 적용

- **시나리오**: FEEDME-014, FEEDME-015, FEEDME-016, FEEDME-018
- **의존성**: Task 1 (패키지), Task 2 (spec 테스트), Task 3 (레이아웃)
- **구현 대상**:
  - `components/feedme-page.tsx`
    - `ReactMarkdown`에 `remarkPlugins={[remarkGfm]}` 추가
- **수용 기준**:
  - [ ] FEEDME-014 테스트 통과: 취소선 → `<del>`
  - [ ] FEEDME-015 테스트 통과: 테이블 → `<table>`
  - [ ] FEEDME-016 테스트 통과: 태스크리스트 → 체크박스
  - [ ] FEEDME-018 테스트 통과: 자동 링크 → `<a>`

---

### Task 5: 코드 블록 구문 하이라이팅 적용

- **시나리오**: FEEDME-017, FEEDME-019
- **의존성**: Task 1 (패키지), Task 2 (spec 테스트), Task 3 (레이아웃)
- **구현 대상**:
  - `components/feedme-page.tsx`
    - `ReactMarkdown`에 `rehypePlugins={[rehypeHighlight]}` 추가
    - highlight.js CSS 테마 import (예: `highlight.js/styles/github.css`)
- **수용 기준**:
  - [ ] FEEDME-017 테스트 통과: 언어 지정 코드 블록에 `language-javascript` 클래스 존재
  - [ ] FEEDME-019 테스트 통과: 언어 미지정 코드 블록에 하이라이팅 클래스 없음

---

## 미결정 사항

- 없음
