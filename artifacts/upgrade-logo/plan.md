# upgrade-logo 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 로고 컴포넌트 | HyperText (@magicui) | 미니멀 + techy 스크램블 효과, 이미 설치됨 |
| 초기화 방식 | 기존 state setter 직접 호출 | 별도 reset 함수 추출하여 handleReset으로 사용 |
| 불필요 컴포넌트 처리 | 파일 삭제 | 7개 텍스트 컴포넌트 + 데모 페이지 제거 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| components/feedme-page.tsx | 수정 | Task 1, 2 |
| components/feedme-page.spec.test.tsx | 수정 | Task 1 |
| components/ui/aurora-text.tsx | 삭제 | Task 3 |
| components/ui/animated-gradient-text.tsx | 삭제 | Task 3 |
| components/ui/colourful-text.tsx | 삭제 | Task 3 |
| components/ui/text-shimmer.tsx | 삭제 | Task 3 |
| components/ui/text-scramble.tsx | 삭제 | Task 3 |
| components/ui/text-effect.tsx | 삭제 | Task 3 |
| components/ui/encrypted-text.tsx | 삭제 | Task 3 |
| app/logo-demo/page.tsx | 삭제 | Task 3 |

## Tasks

### Task 1: spec 테스트 작성

- **시나리오**: LOGO-001, LOGO-002, LOGO-003, LOGO-004
- **의존성**: 없음
- **구현 대상**:
  - `components/feedme-page.spec.test.tsx`
    - LOGO-001: HyperText 컴포넌트가 렌더링되고 "Feed-me" 텍스트 표시 검증
    - LOGO-002: 로고 호버 시 cursor: pointer 스타일 검증
    - LOGO-003: 결과 표시 상태에서 로고 클릭 시 URL 입력값 빈 문자열, 미리보기 사라짐, 복사 버튼 사라짐 검증
    - LOGO-004: 에러 상태에서 로고 클릭 시 에러 메시지 사라짐, URL 입력값 초기화 검증
- **수용 기준**:
  - [ ] `bun run test` 실행 시 LOGO-001~004 테스트가 존재하고 실패한다 (Red)

---

### Task 2: 로고 HyperText 교체 및 클릭 초기화 구현

- **시나리오**: LOGO-001, LOGO-002, LOGO-003, LOGO-004
- **의존성**: Task 1 (spec 테스트가 먼저 존재해야 Green 확인 가능)
- **구현 대상**:
  - `components/feedme-page.tsx`
    - `<h1>feedme</h1>`을 `<HyperText>` 컴포넌트로 교체, 텍스트 "Feed-me"
    - cursor-pointer 클래스 추가
    - handleReset 함수: setUrl(""), setResult(null), setError(null), setCopied(false), setLoading(false)
    - 로고 클릭 시 handleReset 호출
- **수용 기준**:
  - [ ] `bun run test` 실행 시 LOGO-001~004 spec 테스트가 모두 통과한다 (Green)

---

### Task 3: 불필요 컴포넌트 및 데모 페이지 제거

- **시나리오**: 없음 (정리 작업)
- **의존성**: Task 2 (구현 완료 후 정리)
- **구현 대상**:
  - 삭제 대상 파일 7개:
    - `components/ui/aurora-text.tsx`
    - `components/ui/animated-gradient-text.tsx`
    - `components/ui/colourful-text.tsx`
    - `components/ui/text-shimmer.tsx`
    - `components/ui/text-scramble.tsx`
    - `components/ui/text-effect.tsx`
    - `components/ui/encrypted-text.tsx`
  - 삭제 대상 디렉토리:
    - `app/logo-demo/`
- **수용 기준**:
  - [ ] 삭제된 7개 파일이 존재하지 않는다
  - [ ] `app/logo-demo/` 디렉토리가 존재하지 않는다
  - [ ] `bun run test` 실행 시 기존 테스트가 모두 통과한다

---

## 미결정 사항

없음
