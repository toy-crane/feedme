# improve-copy-button 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| split button 구현 방식 | 기존 Button + DropdownMenu 조합 | shadcn DocsCopyPage 레퍼런스와 동일 패턴, 별도 컴포넌트 추출 없이 feedme-page 내에서 구현 |
| 아이콘 라이브러리 | lucide-react (기존) + 서비스별 커스텀 SVG | ChatGPT/Claude 아이콘은 공식 SVG 사용, 나머지는 lucide-react |
| URL 생성 방식 | `encodeURIComponent`로 마크다운 내용을 query param에 포함 | shadcn 레퍼런스와 동일 |
| 토스트 제거 | 체크 아이콘 변경으로 피드백 대체 | 사용자 요청 |

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| shadcn | Task 3 | DropdownMenu 컴포넌트 조합 패턴, variant/size 사용법 |
| vercel-composition-patterns | Task 3 | split button 컴포지션 패턴 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `components/feedme-page.spec.test.tsx` | 수정 | Task 1 |
| `components/feedme-page.test.tsx` | 수정 | Task 2 |
| `components/feedme-page.tsx` | 수정 | Task 3 |

## Tasks

### Task 0: DropdownMenu 설치 확인

- **시나리오**: 전제 조건
- **의존성**: 없음
- **구현 대상**:
  - `components/ui/dropdown-menu.tsx` — 이미 설치되어 있음을 확인
- **수용 기준**:
  - [ ] `components/ui/dropdown-menu.tsx` 파일이 존재하고 DropdownMenu 관련 컴포넌트가 export됨

---

### Task 1: spec 테스트 작성 (Red)

- **시나리오**: FEEDME-030, FEEDME-031, FEEDME-032, FEEDME-033, FEEDME-034, FEEDME-035
- **의존성**: 없음
- **구현 대상**:
  - `components/feedme-page.spec.test.tsx`
    - FEEDME-030: 콘텐츠 추출 후 복사 아이콘 + "복사" 텍스트 + chevron 버튼 표시 확인
    - FEEDME-031: 복사 클릭 시 클립보드 복사 + 아이콘 체크로 변경 + 토스트 미표시
    - FEEDME-032: chevron 클릭 시 드롭다운에 2개 메뉴 항목 + 아이콘 표시
    - FEEDME-033: "ChatGPT에서 열기" 클릭 시 올바른 URL의 링크(target=_blank) 확인
    - FEEDME-034: "Claude에서 열기" 클릭 시 올바른 URL의 링크(target=_blank) 확인
    - FEEDME-035: 초기 상태에서 split button 미표시
- **수용 기준**:
  - [ ] `bun run test` 실행 시 새 테스트들이 FAIL (아직 구현 전이므로)
  - [ ] 기존 테스트는 그대로 통과

---

### Task 2: 구현 테스트 작성 (Red)

- **시나리오**: FEEDME-031, FEEDME-033, FEEDME-034
- **의존성**: 없음
- **구현 대상**:
  - `components/feedme-page.test.tsx`
    - 복사 버튼 클릭 시 navigator.clipboard.writeText 호출 확인
    - ChatGPT/Claude 링크의 href가 올바른 URL 형식인지 확인
    - encodeURIComponent로 마크다운이 인코딩되는지 확인
- **수용 기준**:
  - [ ] `bun run test` 실행 시 새 테스트들이 FAIL (아직 구현 전이므로)

---

### Task 3: split button + dropdown 구현 (Green)

- **시나리오**: FEEDME-030, FEEDME-031, FEEDME-032, FEEDME-033, FEEDME-034, FEEDME-035
- **의존성**: Task 1 (spec 테스트가 검증 기준), Task 2 (구현 테스트가 검증 기준)
- **참조**:
  - shadcn — DropdownMenu 컴포넌트 조합
  - `/tmp/shadcn-ui/apps/v4/components/docs-copy-page.tsx` — 레퍼런스 구현
- **구현 대상**:
  - `components/feedme-page.tsx`
    - 기존 `<Button variant="outline">복사</Button>` 2곳을 split button으로 교체
    - 메인 버튼: Copy/Check 아이콘 + "복사" 텍스트
    - Separator (vertical)로 메인 버튼과 chevron 구분
    - ChevronDown 버튼 → DropdownMenuTrigger
    - DropdownMenuContent에 ChatGPT/Claude 메뉴 항목 (서비스 SVG 아이콘 포함)
    - 각 메뉴 항목은 `<a href="..." target="_blank">` 링크
    - 기존 "복사됨" 토스트 UI 제거
    - copied 상태 시 토스트 대신 아이콘만 Check으로 변경
- **수용 기준**:
  - [ ] Task 1의 모든 spec 테스트 통과
  - [ ] Task 2의 모든 구현 테스트 통과
  - [ ] `bun run test` 전체 통과

---

## 미결정 사항

없음
