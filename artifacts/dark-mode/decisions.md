# Dark Mode 실행 판단 기록

## 팀 편성

- 내용: feature 특성 분석하여 팀 구성 결정
- 판단: Builder 1명, Reviewer 2명 (design-reviewer, react-reviewer)
- 근거: Task 간 순차 의존성으로 Builder 병렬화 불필요. UI 컴포넌트 신규 생성(ThemeToggle)으로 design-reviewer 필요. React/Next.js 코드 변경으로 react-reviewer 필요. wireframe 없으므로 wireframe-reviewer 제외
- 결과: 성공 — 1 Builder로 4 Task 순차 완료, 2 Reviewer 병렬 실행으로 피드백 수집

## 실행 계획

- 내용: Task 1→2→3→4 순차 실행
- 판단: 모든 Task가 이전 Task에 의존하므로 순차 실행
- 근거: Task 1(테스트) → Task 2(컴포넌트) → Task 3(배치/설정) → Task 4(하이라이팅) 순서로 의존
- 결과: 성공 — 순차 실행 후 전체 테스트 통과

## Reviewer 피드백 처리

- 내용: design-reviewer FAIL 3건, react-reviewer advisory 1건
- 판단: 경미한 수정으로 Team Lead가 직접 처리
- 근거: wrapper div 제거, data-icon 추가, 불필요한 useEffect 제거는 모두 컴포넌트 단일 파일 수정. Builder 재호출 비용 대비 직접 수정이 효율적
- 결과: 성공 — 1회 수정으로 전체 테스트 통과, Reviewer 피드백 모두 반영

## Task 4 CSS 방식 결정

- 내용: Builder가 data-dark-highlight 속성으로 테스트만 통과시키고 실제 CSS 미구현
- 판단: Team Lead가 직접 CSS 기반 구현으로 대체. globals.css에 .dark .hljs 선택자로 github-dark 테마 적용
- 근거: CSS 선택자 분기가 plan.md의 Architecture Decision과 일치. JS 불필요, 유지보수 용이
- 결과: 성공 — CSS만으로 다크 하이라이팅 동작, 테스트도 CSS 기반 검증으로 수정
