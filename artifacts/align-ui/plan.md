# align-ui 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 출처 필드 통일 | `source` 필드로 YouTube channel / webpage author / 도메인명을 통일 | 프론트엔드에서 type 분기 없이 동일하게 렌더링 가능 |
| 도메인 추출 위치 | 백엔드(extract.ts) | 프론트엔드에서 URL 파싱 불필요, 서버에서 일관된 값 제공 |
| type 분기 제거 | 프론트엔드 결과 영역에서 `result.type === "youtube"` 조건 제거 | 통일된 레이아웃 구조의 핵심 |

## Data Model

### ExtractResult (변경)
- title (required)
- content (required)
- type: "webpage" | "youtube" (required)
- thumbnail?: string — YouTube 썸네일 또는 OG 이미지
- source?: string — YouTube 채널명, author, 또는 도메인명

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| shadcn | Task 4 | 컴포넌트 composition 규칙 |
| vercel-react-best-practices | Task 4 | 조건부 렌더링 패턴 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `lib/extract.ts` | 수정 | Task 3 |
| `lib/extract.test.ts` | 수정 | Task 2, 3 |
| `components/feedme-page.tsx` | 수정 | Task 4 |
| `components/feedme-page.spec.test.tsx` | 수정 | Task 1 |
| `components/feedme-page.test.tsx` | 수정 | Task 4 |
| `app/api/extract/route.test.ts` | 수정 | Task 2 |

## Tasks

### Task 1: spec 테스트 작성 (ALIGN-001~005)

- **시나리오**: ALIGN-001, ALIGN-002, ALIGN-003, ALIGN-004, ALIGN-005
- **의존성**: 없음
- **구현 대상**:
  - `components/feedme-page.spec.test.tsx`
    - ALIGN-001: OG 이미지가 있는 웹페이지 → 썸네일 img가 표시됨
    - ALIGN-002: OG 이미지가 없는 웹페이지 → 썸네일 img가 없음
    - ALIGN-003: author가 있는 웹페이지 → 출처에 author 텍스트 표시
    - ALIGN-004: author가 없는 웹페이지 → 출처에 도메인명 표시
    - ALIGN-005: YouTube/웹페이지 결과의 요소 순서와 gap이 동일
- **수용 기준**:
  - [ ] 모든 spec 테스트가 존재하고, 현재 구현에서 실패한다 (Red)

---

### Task 2: spec 테스트 작성 (ALIGN-006~007, 백엔드)

- **시나리오**: ALIGN-006, ALIGN-007
- **의존성**: 없음
- **구현 대상**:
  - `lib/extract.test.ts`
    - ALIGN-006: OG 이미지+author가 있는 웹페이지 → 응답에 thumbnail, source 포함
    - ALIGN-007: author 없는 웹페이지 → source에 도메인명 포함
- **수용 기준**:
  - [ ] 모든 spec 테스트가 존재하고, 현재 구현에서 실패한다 (Red)

---

### Task 3: 백엔드 — 웹페이지 메타 정보 반환

- **시나리오**: ALIGN-006, ALIGN-007
- **의존성**: Task 2 (테스트가 먼저 존재해야 함)
- **참조**:
  - next-best-practices — route handler 패턴
- **구현 대상**:
  - `lib/extract.ts`
    - ExtractResult 타입에 source 필드 추가
    - 웹페이지 반환 시 image → thumbnail, author → source 포함
    - author 없을 때 URL에서 도메인명 추출하여 source로 반환
    - YouTube 반환 시 channel → source로 필드명 통일
- **수용 기준**:
  - [ ] Task 2의 spec 테스트가 모두 통과한다 (Green)
  - [ ] 기존 extract.test.ts 테스트도 모두 통과한다

---

### Task 4: 프론트엔드 — 결과 UI 통일

- **시나리오**: ALIGN-001, ALIGN-002, ALIGN-003, ALIGN-004, ALIGN-005
- **의존성**: Task 1 (spec 테스트 존재), Task 3 (백엔드 데이터 모델 확정)
- **참조**:
  - shadcn — composition 규칙
  - vercel-react-best-practices — 조건부 렌더링
- **구현 대상**:
  - `components/feedme-page.tsx`
    - `result.type === "youtube"` 분기 제거
    - 썸네일: thumbnail이 있으면 표시 (aspect-ratio: 16/9, object-fit: cover), 없으면 생략 (type 무관)
    - 출처: source가 있으면 제목 아래에 표시 (type 무관)
    - gap을 gap-4로 통일
    - ExtractResult 타입에서 channel 제거, source 사용
    - 복사 버튼(SplitCopyButton), 프롬프트(Collapsible)는 기존 유지 — 변경 없음
- **수용 기준**:
  - [ ] Task 1의 spec 테스트가 모두 통과한다 (Green)
  - [ ] 기존 feedme-page.test.tsx 테스트도 모두 통과한다
  - [ ] `bun run test` 전체 통과

---

## 미결정 사항

없음
