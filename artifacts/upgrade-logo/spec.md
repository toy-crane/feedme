## Overview
단순 텍스트였던 로고를 HyperText 컴포넌트로 교체하여 미니멀하면서 techy한 브랜드 인상을 주고, 로고 클릭 시 전체 상태를 초기화하여 Home 역할을 부여한다.

## 시나리오

### 1. 로고에 HyperText 애니메이션 적용
[상황] 사용자가 feedme 페이지에 접속하면
[동작] 로고 "Feed-me" 텍스트가 HyperText 스크램블 애니메이션으로 표시된다

성공 기준:
- [ ] 로고 영역에 HyperText 컴포넌트가 렌더링된다
- [ ] 로고 텍스트가 "Feed-me"이다
- [ ] 호버 시 스크램블 애니메이션이 재실행된다

### 2. 로고 클릭 시 전체 초기화
[상황] 콘텐츠가 추출되어 결과가 표시된 상태에서
[동작] 사용자가 로고 "Feed-me"를 클릭하면 URL 입력값, 추출 결과, 에러, 복사 상태가 모두 초기화된다

성공 기준:
- [ ] 로고 클릭 -> URL 입력값이 빈 문자열로 초기화
- [ ] 로고 클릭 -> 추출 결과(마크다운 미리보기)가 사라짐
- [ ] 로고 클릭 -> 에러 메시지가 사라짐
- [ ] 로고 클릭 -> 복사 상태가 초기화됨

### 3. 로고에 커서 스타일 적용
[상황] 사용자가 로고 위에 마우스를 올리면
[동작] 클릭 가능함을 나타내는 포인터 커서가 표시된다

성공 기준:
- [ ] 로고 요소에 cursor: pointer 스타일이 적용된다

## 범위

### 포함
- HyperText 컴포넌트로 로고 교체
- 로고 텍스트 "feedme" -> "Feed-me" 변경
- 로고 클릭 시 전체 상태 초기화 (URL, 결과, 에러, 복사)
- 사용하지 않는 텍스트 컴포넌트 제거 (aurora-text, animated-gradient-text, colourful-text, text-shimmer, text-scramble, text-effect, encrypted-text)
- 데모 페이지(app/logo-demo) 제거

### 제외
- 로고 폰트 변경 — 기존 font-bold 유지
- 로고 사이즈 변경 — 기존 text-3xl 유지
- 별도 로고 이미지/아이콘 추가 — 텍스트 로고만 사용

## 전제 조건
- @magicui/hyper-text 컴포넌트 설치 완료 (components/ui/hyper-text.tsx)

## 미결정 사항
- 없음
