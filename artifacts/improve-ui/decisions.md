# improve-ui decisions

## 팀 편성

- 내용: feature 특성 분석 후 팀 구성 결정
- 판단: Builder 1명, Reviewer 2명 (design-reviewer, react-reviewer)
- 근거: 단일 파일(feedme-page.tsx) 수정 중심. Task 간 순차 의존성이 있어 병렬 Builder 불필요. wireframe-reviewer는 레이아웃이 단순하여 생략
- 결과: 성공 — Builder 1명으로 5 Task 순차 완료, Reviewer 2명 병렬 실행 후 1회 수정으로 pass

## 실행 순서

- 내용: Task 1→2→3→4+5 순차 실행
- 판단: Task 4, 5는 독립적이지만 동일 파일 수정이므로 하나의 Builder에서 합쳐서 실행
- 근거: 동일 파일 동시 수정 시 충돌 위험. Builder 1명으로 순차 처리가 안전
- 결과: 성공 — Task 4+5 합침으로 Builder 호출 1회 절약

## Reviewer 피드백 처리

- 내용: design-reviewer FAIL 3건 (커스텀 토스트, 로딩 div, 인라인 style), react-reviewer advisory 1건 (플러그인 배열 안정성)
- 판단: design-reviewer 3건은 기존 코드 문제로 spec 범위 밖이므로 수정 생략. react-reviewer advisory는 이번 변경에서 추가된 코드이므로 Team Lead가 직접 수정
- 근거: improve-ui spec은 마크다운 렌더링 품질과 레이아웃 개선만 포함. 기존 토스트/로딩 리팩터링은 별도 feature로 처리해야 함
- 결과: 성공 — 플러그인 배열을 모듈 상수로 추출, 전체 38 테스트 pass 유지
