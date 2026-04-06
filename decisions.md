# feedme 판단 기록

## 팀 편성

- 내용: Builder 2명, Reviewer 3종 (wireframe-reviewer, design-reviewer, react-reviewer)
- 판단: Task 1(spec 테스트)과 Task 2(추출 로직)는 독립적이므로 Builder 2명 병렬 투입
- 근거: Task 1과 Task 2는 파일이 겹치지 않아 병렬 안전. wireframe.html 존재 + React/Next.js + shadcn UI 사용
- 결과: 성공 — Task 1-4 모두 1회 Builder 위임으로 완료, 전체 테스트 27/27 통과

## 실행 계획

- 내용: Phase 1(병렬: Task 1 + Task 2) → Phase 2(순차: Task 3) → Phase 3(순차: Task 4)
- 판단: 의존성 기반 3단계 실행
- 근거: Task 3은 Task 2의 extractContent 함수에 의존, Task 4는 Task 3의 API 엔드포인트에 의존
- 결과: 성공 — 3단계 순차 실행 완료

## Design Reviewer 피드백 처리

- 내용: Design Reviewer FAIL — shadcn 컴포넌트 미사용 5건 (FieldGroup/Field, InputGroup, Alert, Spinner)
- 판단: Builder에게 수정 위임. 기존 field.tsx, input-group.tsx 활용, Alert 신규 설치
- 근거: 구현 수준 수정이 필요하며, 테스트 통과를 유지해야 함
- 결과: 성공 — 5건 중 4건 수정, Spinner는 컴포넌트 미존재로 현행 유지

## Wireframe Reviewer 피드백 처리

- 내용: Wireframe Reviewer 4/5 PASS, 1 FAIL (YouTube 결과 화면 — 전용 레이아웃 없음)
- 판단: Builder에게 YouTube 전용 레이아웃 구현 위임
- 근거: wireframe의 썸네일/메타/자막 카드 구조가 구현에 완전 누락
- 결과: 부분 — YouTube 전용 레이아웃은 추가되었으나, 아래 4건의 레이아웃 불일치를 놓침

## Wireframe Reviewer 누락 분석

- 내용: wireframe-reviewer가 PASS로 판정했지만, Team Lead 재점검에서 4건의 불일치가 추가 발견됨
- 판단: Builder에게 수정 위임
- 근거: reviewer가 놓친 원인 분석
  1. **제목 정렬 (좌측→중앙)**: wireframe 코드에는 명시적 text-align이 없어 "기본값=좌측"이라는 판단이 필요했으나, reviewer가 "Low severity"로 분류하고 PASS 처리
  2. **입력/버튼 반응형 분리**: Design Reviewer가 InputGroup 패턴을 권장해서 적용한 결과, wireframe의 flex-col→flex-row 반응형 의도가 덮어씌워짐. reviewer는 "reasonable UX simplification"으로 판단했으나 wireframe 정합성 관점에서는 불일치
  3. **"미리보기" 라벨 + 복사 버튼 위치**: wireframe에서 프리뷰 위 한 줄로 배치된 구조를 reviewer가 "layout refinement"로 분류하고 PASS 처리
  4. **토스트 위치**: wireframe의 fixed-position 토스트를 reviewer가 "inline feedback instead of toast"로 인지했으나 PASS 처리
  - 근본 원인: reviewer가 "구조적 불일치"와 "비주얼 디자인 차이"의 경계를 너무 관대하게 판단. 정보 계층(라벨 유무, 요소 배치 순서)은 구조에 해당하므로 fail로 잡았어야 함
- 결과: 성공 — 4건 중 3건 수정 (제목 정렬, 미리보기 라벨+복사 위치, 토스트). 입력/버튼은 사용자 판단으로 InputGroup 유지

## InputGroup 내 Button vs InputGroupButton 문제

- 내용: InputGroup 안에 일반 `Button`을 사용하여 여백이 비정상적으로 렌더링됨. InputGroup은 `h-8` 고정 높이인데 일반 Button은 `h-9`~`h-10`이라 컨테이너를 넘침
- 판단: `Button` → `InputGroupButton variant="secondary"`로 교체
- 근거: shadcn 예시에서 텍스트 버튼도 `InputGroupButton`을 사용하는 패턴이 존재 (`<InputGroupButton variant="secondary">Search</InputGroupButton>`)
- 결과: 성공 — 여백 정상화, 27/27 테스트 유지

### 왜 처음부터 올바르게 구현되지 못했는가

의사결정 체인에서 4단계 연쇄 실패가 발생했다:

1. **Design Reviewer**: `forms.md` 규칙("Buttons inside inputs use InputGroup + InputGroupAddon")을 근거로 InputGroup 사용을 권장했으나, 규칙의 Correct 예시가 `Button size="icon"`(아이콘 유틸리티 버튼)이었음. 텍스트 액션 버튼에 이 규칙을 적용하는 것이 적절한지 판단하지 않음
2. **Builder (수정 1차)**: Design Reviewer 피드백을 그대로 구현. `InputGroupButton` export가 `input-group.tsx`에 존재하는지 확인하지 않고 기존 `Button`을 `InputGroupAddon` 안에 넣음
3. **Team Lead**: Builder 결과를 검수할 때 시각적 렌더링을 확인하지 않고 테스트 통과만으로 승인
4. **Reviewer 구조적 한계**: Design Reviewer는 코드 패턴만 검증하고, Wireframe Reviewer는 스크린샷 기반이지만 컴포넌트 내부 여백 같은 세밀한 시각 품질까지 검증하지 않음. 어떤 Reviewer도 "이 컴포넌트의 다른 export를 사용해야 하는 것 아닌가?"라는 API 탐색을 수행하지 않음

### 재발 방지를 위한 교훈

- shadcn 컴포넌트를 적용할 때, 해당 컴포넌트 파일의 **전체 export 목록**을 확인해야 함
- `forms.md` 규칙의 Correct 예시가 아이콘 버튼에 한정되어 있어, 텍스트 버튼 케이스가 누락됨 — 규칙 자체의 불완전성
- 컴포넌트 기본 스타일(`h-8`)을 className으로 덮어쓰면 안 된다는 규칙이 있으므로, 기본 스타일과 충돌하는 사용법은 곧 "잘못된 컴포넌트 선택"을 의미함

## YouTube 자막 카드 디자인 불일치

- 내용: YouTube 자막 영역을 shadcn Card(CardHeader/CardAction/CardContent)로 구현했으나, wireframe에서는 웹페이지 미리보기와 동일한 패턴(라벨 + 복사 버튼 행 → bordered 영역)으로 디자인되어 있었음. 결과적으로 웹페이지 결과와 YouTube 결과의 시각적 일관성이 깨짐
- 판단: Card 구조를 제거하고 웹페이지 미리보기와 동일한 패턴으로 통일
- 근거: wireframe의 YouTube 자막 영역(`w-preview`)이 웹페이지 미리보기와 같은 스타일 클래스를 사용. "자막" 라벨 + "복사" 버튼 행 → 스크롤 가능한 bordered 영역 구조
- 결과: 성공 — Card 제거, 웹페이지와 동일한 패턴 적용, 27/27 테스트 유지

### 왜 wireframe과 다르게 구현되었는가

1. **Builder**: wireframe의 YouTube 화면(screen-3)에 "자막 카드"라는 표현이 있어 shadcn Card 컴포넌트를 선택. wireframe의 실제 HTML 구조(`w-preview` + `flex justify-between`)가 웹페이지 미리보기와 동일한 패턴이라는 점을 확인하지 않음
2. **Team Lead**: Builder에게 "자막 카드"라고 지시하면서 Card 컴포넌트 사용을 암시. wireframe의 구체적 HTML 구조를 참조하도록 명시하지 않음
3. **Wireframe Reviewer**: YouTube 전용 레이아웃 존재 여부만 확인하고, 웹페이지 결과와의 시각적 일관성을 검증하지 않음
