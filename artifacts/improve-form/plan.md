# 구현 계획: improve-form

Input form의 로딩 버튼 및 에러 상태 개선

## Affected Files

| 파일 | 변경 내용 |
|------|----------|
| `components/feedme-page.tsx` | 버튼 disabled 조건, 스피너, 에러 인라인 표시, onChange 에러 해제 |
| `components/feedme-page.spec.test.tsx` | spec.yaml 기반 수용 기준 테스트 (신규) |
| `components/feedme-page.test.tsx` | 단위 테스트 추가/수정 (신규) |

## Tasks

### Task 1: spec 테스트 작성

spec.yaml의 FEEDME-003, FEEDME-006~012 시나리오에 대한 수용 기준 테스트를 작성한다.

**파일**: `components/feedme-page.spec.test.tsx`

**수용 기준**:
- [ ] FEEDME-006: 빈 URL → 버튼 disabled
- [ ] FEEDME-007: 잘못된 URL ("not-a-url") → 버튼 disabled
- [ ] FEEDME-012: 잘못된 URL → 유효한 URL로 수정 → 버튼 활성화
- [ ] FEEDME-003: 로딩 중 → 버튼에 스피너 표시, 텍스트 없음, 별도 로딩 영역 없음
- [ ] FEEDME-008: 접근 불가 URL → 인라인 에러 텍스트, Alert 없음
- [ ] FEEDME-009: 자막 없는 YouTube → 인라인 에러 텍스트, Alert 없음
- [ ] FEEDME-011: 네트워크 오류 → 인라인 에러 텍스트, Alert 없음
- [ ] FEEDME-010: 에러 표시 중 입력 수정 → 에러 사라짐
- [ ] 모든 테스트가 Red 상태 (아직 구현 전)

### Task 2: 구현 테스트 작성

순수 로직 단위 테스트를 작성한다.

**파일**: `components/feedme-page.test.tsx`

**수용 기준**:
- [ ] `isValidUrl` 반환값에 따라 버튼 disabled 상태가 결정되는지 테스트
- [ ] onChange 핸들러가 error 상태를 null로 초기화하는지 테스트
- [ ] 모든 테스트가 Red 상태

### Task 3: 버튼 disabled 조건 구현

빈 입력 또는 잘못된 URL일 때 버튼을 비활성화한다.

**파일**: `components/feedme-page.tsx`

**수용 기준**:
- [ ] `isValidUrl(url)`이 false이면 버튼 disabled (빈 문자열 포함)
- [ ] 로딩 중에도 버튼 disabled (기존 동작 유지)
- [ ] 기존 `handleFetch` 내 클라이언트 유효성 검사 코드 제거 (더 이상 도달 불가)
- [ ] Task 1의 FEEDME-006, FEEDME-007, FEEDME-012 테스트 통과
- [ ] Task 2의 관련 테스트 통과

### Task 4: 로딩 스피너 구현

로딩 중 버튼에 스피너 아이콘만 표시하고, 별도 로딩 영역을 제거한다.

**파일**: `components/feedme-page.tsx`

**수용 기준**:
- [ ] 로딩 중 버튼 텍스트("가져오기") 대신 `lucide-react`의 `Loader2` 스피너 아이콘 표시
- [ ] 별도 로딩 영역 (`role="status"`, "불러오는 중...") 제거
- [ ] Task 1의 FEEDME-003 테스트 통과

### Task 5: 에러 인라인 표시 및 자동 해제

Alert 컴포넌트를 제거하고 입력 필드 하단에 인라인 에러 텍스트로 교체한다. URL 입력 시 에러를 자동 해제한다.

**파일**: `components/feedme-page.tsx`

**수용 기준**:
- [ ] 서버 에러 시 입력 필드 하단에 빨간 인라인 텍스트 표시
- [ ] Alert 컴포넌트 import 및 사용 제거
- [ ] URL 입력란의 onChange에서 에러 상태를 null로 초기화
- [ ] Task 1의 FEEDME-008, FEEDME-009, FEEDME-011, FEEDME-010 테스트 통과
- [ ] Task 2의 관련 테스트 통과
- [ ] `bun run test` 전체 통과

## 참조 스킬

| 스킬 | 용도 |
|------|------|
| `shadcn` | Button 컴포넌트 variant/disabled 패턴, 스피너 구현 참고 |
