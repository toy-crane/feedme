# improve-copy-button 구현 계획 (Phase 2: 마크다운 다운로드)

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 다운로드 방식 | Blob + URL.createObjectURL + `<a download>` | 서버 불필요, 클라이언트에서 즉시 다운로드 |
| 파일명 | `{title}.md` / `feedme.md` (fallback) | 사용자가 식별 가능한 파일명 |
| 아이콘 | lucide-react `Download` | 기존 아이콘 라이브러리와 통일 |

## Required Skills

없음 — 추가 스킬 불필요

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `components/feedme-page.spec.test.tsx` | 수정 | Task 1 |
| `components/feedme-page.test.tsx` | 수정 | Task 1 |
| `components/feedme-page.tsx` | 수정 | Task 2 |

## Tasks

### Task 1: 테스트 업데이트 및 추가 (Red)

- **시나리오**: FEEDME-032 (업데이트), FEEDME-036 (신규)
- **의존성**: 없음
- **구현 대상**:
  - `components/feedme-page.spec.test.tsx`
    - FEEDME-032: 드롭다운 항목 수 2→3, "마크다운 다운로드" 항목 추가 검증
    - FEEDME-036: 다운로드 클릭 시 Blob URL 생성 + download 속성에 `{title}.md` 파일명 검증
  - `components/feedme-page.test.tsx`
    - 다운로드 링크의 href가 blob: URL인지 확인
    - download 속성에 올바른 파일명이 설정되는지 확인
    - 제목 없을 때 fallback 파일명 `feedme.md` 확인
- **수용 기준**:
  - [ ] 새 테스트가 FAIL (구현 전)
  - [ ] 기존 테스트 중 FEEDME-032 관련만 FAIL (항목 수 변경)

---

### Task 2: 마크다운 다운로드 구현 (Green)

- **시나리오**: FEEDME-032, FEEDME-036
- **의존성**: Task 1
- **구현 대상**:
  - `components/feedme-page.tsx`
    - SplitCopyButton에 `title` prop 추가
    - 드롭다운 맨 위에 "마크다운 다운로드" 항목 추가
    - lucide-react `Download` 아이콘 사용
    - Blob 기반 다운로드 로직 구현
- **수용 기준**:
  - [ ] `bun run test` 전체 통과 (FEEDME-032, FEEDME-036 포함)

---

## 미결정 사항

없음
