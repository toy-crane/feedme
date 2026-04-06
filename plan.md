# feedme 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 콘텐츠 추출 위치 | Route Handler (`app/api/extract/route.ts`) | 임의 URL fetch는 CORS 제약으로 서버 필수 |
| 마크다운 렌더링 | react-markdown | 렌더링된 미리보기 요구사항, 경량 라이브러리 |
| 페이지 배치 | `app/page.tsx` 교체 | 단일 기능 앱이므로 메인 페이지 사용 |
| defuddle 실행 환경 | 서버 (linkedom) | defuddle은 DOM 기반, linkedom이 가장 빠르고 경량 |

## Data Model

### ExtractResult
- title (required)
- content: string (마크다운 본문)
- type: "webpage" | "youtube"
- channel?: string (YouTube 전용)
- thumbnail?: string (YouTube 전용)

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| next-best-practices | Task 3 | Route Handler 패턴, RSC 경계 |
| shadcn | Task 2, 4 | 토스트 컴포넌트 설치, Input/Button/Card 활용 |
| vercel-react-best-practices | Task 4 | 클라이언트 상태 관리 패턴 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `__tests__/feedme.spec.test.tsx` | 신규 | Task 1 |
| `lib/extract.ts` | 신규 | Task 2 |
| `lib/extract.test.ts` | 신규 | Task 2 |
| `app/api/extract/route.ts` | 신규 | Task 3 |
| `app/api/extract/route.test.ts` | 신규 | Task 3 |
| `app/page.tsx` | 수정 | Task 4 |
| `app/layout.tsx` | 수정 | Task 4 |
| `components/feedme-form.tsx` | 신규 | Task 4 |
| `components/markdown-preview.tsx` | 신규 | Task 4 |
| `components/feedme-form.test.tsx` | 신규 | Task 4 |
| `package.json` | 수정 | Task 2 |

## Tasks

### Task 1: Spec 테스트 작성

- **시나리오**: FEEDME-001 ~ FEEDME-009
- **의존성**: 없음
- **참조**:
  - `artifacts/spec.yaml` — 시나리오 정의
  - `artifacts/feedme/wireframe.html` — 화면 구조
- **구현 대상**:
  - `__tests__/feedme.spec.test.tsx`
    - FEEDME-001: 웹페이지 URL 입력 후 가져오기 → 제목, 본문 미리보기 표시
    - FEEDME-002: YouTube URL 입력 후 가져오기 → 제목, 채널, 자막 미리보기 표시
    - FEEDME-003: 가져오기 클릭 후 로딩 인디케이터 표시
    - FEEDME-004: 초기 화면에서 복사 버튼 미노출
    - FEEDME-005: 복사 버튼 클릭 → 클립보드 복사 + "복사됨" 토스트
    - FEEDME-006: 빈 URL → "올바른 URL을 입력해주세요"
    - FEEDME-007: 잘못된 URL → "올바른 URL을 입력해주세요"
    - FEEDME-008: 접근 불가 URL → "페이지에 접근할 수 없습니다"
    - FEEDME-009: 자막 없는 YouTube → "자막을 찾을 수 없습니다"
- **수용 기준**:
  - [ ] 9개 시나리오에 대한 테스트가 존재한다
  - [ ] 모든 테스트가 Red 상태 (실패)이다

---

### Task 2: 콘텐츠 추출 로직 (lib/extract.ts)

- **시나리오**: FEEDME-001, FEEDME-002, FEEDME-006 ~ FEEDME-009
- **의존성**: 없음 (Task 1과 병렬 가능)
- **참조**:
  - shadcn — 패키지 설치
  - https://github.com/kepano/defuddle — defuddle API
- **구현 대상**:
  - `lib/extract.ts`
    - `extractContent(url: string): Promise<ExtractResult>` 함수
    - URL 유효성 검증 (빈 값, 잘못된 형식)
    - 웹페이지 HTML fetch → defuddle로 본�� 추출 → 마크다운 반환
    - YouTube URL 감지 → 영상 정보 + 자막 추출 → 마크다운 반환
    - 에러 분류 (잘못된 URL, 접근 불가, 자막 없음)
  - `lib/extract.test.ts`
    - URL 유효성 검증 단위 테스트
    - 에러 분류 단위 테스트
  - `package.json`
    - defuddle, react-markdown 의존성 추가
- **수용 기준**:
  - [ ] `extractContent("not-a-url")` → "올바른 URL을 입력해주세요" 에러
  - [ ] `extractContent("")` → "올바른 URL을 입력해주세요" 에러
  - [ ] 유효한 웹페이지 URL → `{ type: "webpage", title, content }` 반환
  - [ ] YouTube URL → `{ type: "youtube", title, channel, content, thumbnail }` 반환
  - [ ] 접근 불가 URL → "페이지에 접근할 수 없습니다" 에러
  - [ ] `lib/extract.test.ts` 모든 테스트 통과

---

### Task 3: Route Handler (app/api/extract/route.ts)

- **시나리오**: FEEDME-001 ~ FEEDME-003, FEEDME-006 ~ FEEDME-009
- **의존성**: Task 2 (extractContent 함수 사용)
- **참조**:
  - next-best-practices — Route Handler 패턴
- **구현 대상**:
  - `app/api/extract/route.ts`
    - POST 핸들러: body에서 url 받아 extractContent 호출
    - 성공 시 ExtractResult JSON 반환
    - 에러 시 적절한 HTTP 상태 코드 + 에러 메시지 반환
  - `app/api/extract/route.test.ts`
    - 정상 요청/에러 응답 단위 테스트
- **수용 기준**:
  - [ ] POST `/api/extract` + `{ url: "https://example.com" }` → 200 + ExtractResult
  - [ ] POST `/api/extract` + `{ url: "" }` → 400 + 에러 메시지
  - [ ] `route.test.ts` 모든 테스트 통과

---

### Task 4: UI 컴포넌트 및 페이지 조립

- **시나리오**: FEEDME-001 ~ FEEDME-009
- **의존성**: Task 3 (API 엔드포인트 필요)
- **참조**:
  - shadcn — Button, Input, Card, Toast 컴포넌트
  - vercel-react-best-practices — 클라이언트 상태 관리
  - `artifacts/feedme/wireframe.html` — 레이아웃 참조
- **구현 대상**:
  - `components/feedme-form.tsx`
    - URL 입력란 + "가져오기" 버튼
    - 로딩 상태 (버튼 비활성화 + 스피너)
    - 에러 메시지 표시 영역
  - `components/markdown-preview.tsx`
    - 렌더링된 마크다운 미리보기
    - 웹페이지: 제목 + 본문
    - YouTube: 썸네일 + 제목/채널/설명 (카드 없이) + 자막 카드 (복사 버튼 포함)
    - YouTube: 자막 영역은 스크롤 가능한 고정 높이 컨테이너로 렌더링
    - "복사" 버튼 → 클립보드 복사 + "복사됨" 토스트
  - `app/page.tsx`
    - FeedmeForm + MarkdownPreview 조립
    - 초기 상태에서 복사 버튼/미리보기 미노출
  - `app/layout.tsx`
    - metadata 업데이트 (title: "feedme")
  - `components/feedme-form.test.tsx`
    - 폼 인터랙션 단위 테스트
- **수용 기준**:
  - [ ] 초기 화면: URL 입력란 + 가져오기 버튼만 표시, 복사 버튼 없음
  - [ ] 웹페이지 URL 가져오기 → 렌더링된 마크다운 미리보기 표시
  - [ ] YouTube URL 가져오기 → 썸네일 + 영상 정보 + 자막 카드 표시
  - [ ] 가져오기 중 로딩 인디케이터 표시
  - [ ] 복사 버튼 클릭 → 클립보드에 마크다운 복사 + "복사됨" 토스트
  - [ ] 잘못된 URL → 에러 메시지 표시
  - [ ] `feedme-form.test.tsx` 모든 테스트 통과
  - [ ] `__tests__/feedme.spec.test.tsx` 모든 테스트 통과 (Green)

---

## 미결정 사항

- 없음
