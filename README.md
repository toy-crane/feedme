# feedme

어떤 URL이든, Markdown으로 — AI 챗봇에 바로 붙여넣을 수 있는 미니멀 웹 도구

## 기능

- **URL → Markdown 변환**: URL을 입력하면 콘텐츠를 추출하여 Markdown으로 렌더링
- **클립보드 복사**: Markdown 단독 복사 또는 프롬프트와 함께 복사
- **커스텀 프롬프트**: 프리셋 프롬프트 선택 또는 직접 작성하여 콘텐츠와 함께 복사
- **다크 모드**: 시스템 테마에 연동되는 라이트/다크 모드 지원

## 기술 스택

- **Framework**: Next.js 16 (App Router), React 19
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI, Base UI
- **Content Extraction**: Defuddle, linkedom
- **Markdown**: react-markdown, remark-gfm, rehype-highlight
- **Animation**: Motion
- **Testing**: Vitest, Testing Library, Playwright
- **Package Manager**: Bun

## 시작하기

```bash
bun install
bun dev
```

[http://localhost:3000](http://localhost:3000)에서 결과를 확인할 수 있습니다.

## 스크립트

| 명령어 | 설명 |
|---|---|
| `bun dev` | 개발 서버 실행 |
| `bun run build` | 프로덕션 빌드 |
| `bun start` | 프로덕션 서버 실행 |
| `bun run lint` | ESLint 실행 |
| `bun run test` | 테스트 실행 |
| `bun run test:watch` | 테스트 워치 모드 |

## 프로젝트 구조

```
app/                  # Next.js 라우트 및 API
  api/extract/        # 콘텐츠 추출 API 엔드포인트
components/           # React 컴포넌트
hooks/                # 커스텀 훅 (use-feedme, use-extract, use-prompt, use-clipboard)
lib/                  # 유틸리티 (콘텐츠 추출, Markdown 플러그인)
types/                # TypeScript 타입 정의
config/               # 설정 파일
artifacts/            # 스펙 및 기능 문서
  spec.yaml           # 단일 불변 계약 (요구사항 정의)
__tests__/            # spec.yaml 기반 수용 기준 테스트
```

## 개발 워크플로우

이 프로젝트는 spec-driven TDD로 개발합니다.

1. **Spec** — `artifacts/spec.yaml`에 요구사항 정의
2. **Wireframe** — spec 기반 HTML 와이어프레임으로 레이아웃 검증
3. **Plan** — 구현 계획 수립
4. **Execute** — TDD로 구현 후 검증
5. **Improve** — 반복 패턴 감지 및 개선

## 테스트

| 파일 패턴 | 용도 |
|---|---|
| `*.spec.test.tsx` | 수용 기준 테스트 (`artifacts/spec.yaml`에서 파생) |
| `*.test.tsx` | 구현 단위/통합 테스트 |
