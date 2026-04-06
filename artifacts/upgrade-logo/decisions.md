# upgrade-logo Decisions

## 팀 편성

- 내용: Builder 1명 (순차 실행), Reviewer로 react-reviewer 선별
- 판단: Task 3개가 모두 순차 의존성이라 Builder 1명으로 순차 실행. wireframe 없으므로 wireframe-reviewer 제외. UI 변경이 단순(로고 교체)하여 design-reviewer 제외. React/Next.js 코드 변경이 있으므로 react-reviewer만 선별
- 근거: 병렬화 이득이 없는 순차 의존 구조. 변경 범위가 단일 컴포넌트(feedme-page.tsx)에 집중
- 결과: 성공 — Builder 1명 순차 위임으로 3 Task 완료, react-reviewer 1회 실행

## 실행 순서

- 내용: Task 1 → Task 2 → Task 3 순차 실행
- 판단: plan.md 의존성 그대로 순차 실행
- 근거: Task 2는 Task 1의 테스트가 있어야 Green 확인 가능, Task 3는 구현 완료 후 정리
- 결과: 성공 — 순차 실행으로 54 테스트 전수 통과

## react-reviewer img 태그 피드백

- 내용: react-reviewer가 feedme-page.tsx:137의 `<img>` 태그를 next/image로 교체하라고 지적
- 판단: 범위 밖으로 무시. 기존 코드(YouTube 썸네일)이며 이번 feature 변경 범위(로고 영역)와 무관
- 근거: upgrade-logo feature는 로고 교체와 클릭 초기화만 포함. 기존 코드 수정은 별도 issue로 분리
- 결과: 성공 — 범위 밖 피드백 적절히 필터링
