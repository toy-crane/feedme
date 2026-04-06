# Decisions: improve-form

## DEC-001: 팀 편성

**결정**: Builder 1명, react-reviewer + design-reviewer

**근거**: 모든 구현 Task가 `feedme-page.tsx` 하나를 공유하므로 병렬 Builder는 충돌 위험. wireframe 없으므로 wireframe-reviewer 제외.

## DEC-003: Reviewer 피드백 처리

**결정**: 범위 내 4개 항목 직접 수정, 범위 외 4개 항목 무시

**수정한 항목:**
- Enter 키 핸들러에 `isValidUrl(url) && !loading` 조건 추가
- 에러 메시지에 `aria-live="polite"` 추가
- `InputGroupInput`에 `aria-invalid={!!error}` 추가
- `InputGroupInput`에 `name="url"` + `autoComplete="url"` 추가

**무시한 항목 (기존 코드, 이번 feature 범위 외):**
- `<img>` → `next/image` 교체
- `ReactMarkdown` → `next/dynamic` 동적 임포트
- sonner 토스트 교체
- `Spinner` 컴포넌트 교체 (Loader2로 충분)

**근거**: improve-form feature는 폼의 로딩/에러 UX 개선이 목적. 기존 코드의 이미지 최적화, 번들 최적화는 별도 task로 분리해야 함.

## DEC-002: Task 실행 순서

**결정**: Task 1, 2 병렬 → Task 3 → Task 4 → Task 5 순차

**근거**: 테스트 파일은 독립적이라 병렬 작성 가능. 구현 Task는 같은 파일을 점진적으로 수정하므로 순차.
