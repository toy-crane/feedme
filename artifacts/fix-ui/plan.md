# fix-ui 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| Clear 버튼 위치 | InputGroupAddon 내 fetch 버튼 앞 | wireframe 확정: X 버튼 → 구분선 → fetch 버튼 순서 |
| Clear 범위 | URL만 비움 (프리뷰, 프롬프트 유지) | 사용자 확인 완료. 전체 초기화는 로고 클릭으로 이미 제공됨 |
| 구분선 | clear 버튼과 fetch 버튼 사이 세로 구분선 | wireframe 피드백 반영 |

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| shadcn | Task 2 | InputGroupButton 규칙 준수 확인 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `__tests__/fix-ui.spec.test.tsx` | 신규 | Task 1 |
| `components/url-input-section.tsx` | 수정 | Task 2 |

## Tasks

### Task 1: spec 테스트 작성

- **시나리오**: FEEDME-050, FEEDME-051, FEEDME-052, FEEDME-053
- **의존성**: 없음
- **구현 대상**:
  - `__tests__/fix-ui.spec.test.tsx`
    - FEEDME-050: URL 있을 때 clear 버튼 표시, 비어있으면 숨김
    - FEEDME-051: clear 클릭 시 URL만 비움, 프리뷰 유지
    - FEEDME-052: 로딩 중 clear 버튼 숨김
    - FEEDME-053: clear 클릭 시 에러 메시지도 함께 제거
- **수용 기준**:
  - [ ] `bun run test __tests__/fix-ui.spec.test.tsx` 실행 시 4개 시나리오 모두 FAIL (Red)

---

### Task 2: Clear 버튼 구현

- **시나리오**: FEEDME-050, FEEDME-051, FEEDME-052, FEEDME-053
- **의존성**: Task 1 (테스트가 먼저 존재해야 Green 확인 가능)
- **참조**:
  - shadcn — InputGroupButton, InputGroupAddon
- **구현 대상**:
  - `components/url-input-section.tsx`
    - X 아이콘 clear 버튼 (InputGroupButton, Lucide X 아이콘)
    - 구분선 (세로 separator)
    - 조건부 렌더링: `url.length > 0 && !loading`일 때만 표시
    - onClick: `onUrlChange("")` + `onErrorClear()` 호출
    - aria-label="입력 지우기"
- **수용 기준**:
  - [ ] `bun run test __tests__/fix-ui.spec.test.tsx` 실행 시 4개 시나리오 모두 PASS (Green)
  - [ ] `bun run test` 전체 테스트 통과

---

## 미결정 사항

없음
