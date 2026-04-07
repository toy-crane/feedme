## 팀 편성

- 내용: replace-api-to-worker feature는 UI 변경 없이 백엔드(Worker) + 프론트엔드 API 호출만 변경. wireframe 없음.
- 판단: Builder 1명으로 순차 실행. Reviewer는 react-reviewer만 적용. wireframe-reviewer, ui-quality-reviewer, design-reviewer는 불필요.
- 근거: UI 변경 없으므로 시각 리뷰 불필요. Worker 코드는 별도 프로젝트라 Builder 1명이 순차적으로 진행하는 게 index.ts 충돌 방지에 유리.
- 결과: 성공 — react-reviewer pass (advisory 1건 즉시 수정)

## 실행 순서

- 내용: Task 간 의존성 분석
- 판단: Task 1+2 병렬 → Task 3 → Task 4 → Task 5+5.1 병렬 → Task 5.5 → Task 6 → Task 7 순차
- 근거: index.ts 충돌 방지를 위해 Task 3/4 순차, Task 5/5.1은 독립 모듈이므로 병렬.
- 결과: 성공 — 캐시 히트 CORS 누락을 Phase 4 후 즉시 수정, defuddle diff에서 P0~P2 갭 6건 발견 및 전체 수정

## Content-Type 없는 응답 허용

- 내용: fetch 응답에 Content-Type 헤더가 없는 경우 처리 방식
- 판단: Content-Type이 없으면 허용, 있으면 text/html 또는 xhtml+xml만 허용
- 근거: 일부 오래된 서버가 Content-Type을 반환하지 않으므로 엄격 거부 시 정상 사이트가 차단될 수 있음.
- 결과: 성공 — 테스트 통과, 실용적 판단

## 캐시-Rate limit 순서

- 내용: 캐시 히트 시 rate limit 소비 여부
- 판단: spec 준수 — 캐시 히트 시에도 rate limit 카운트 증가. body 파싱만 rate limit 앞으로 이동.
- 근거: spec.yaml WORKER-006에 명시. 잘못된 JSON이 rate limit을 소비하지 않도록 최적화.
- 결과: 성공 — spec 정합성 유지

## turndown browser 번들 해결

- 내용: wrangler(esbuild)가 turndown의 `browser` 필드를 해석하여 브라우저 번들을 로드 → `document is not defined` 에러 발생. Workers 런타임에 전역 `document`가 없기 때문. defuddle의 `toMarkdown()` → turndown → `document.implementation.createHTMLDocument()` 경로에서 실패.
- 판단: `WRANGLER_BUILD_CONDITIONS=workerd,worker` 환경변수로 esbuild의 `browser` 조건을 제거하여 Node 번들(`@mixmark-io/domino` 사용)이 resolve되도록 설정. `no_bundle` + 외부 번들러 방식은 불채택.
- 근거: 3가지 방법을 비교 검토함. (1) `WRANGLER_BUILD_CONDITIONS` — Cloudflare 컨트리뷰터가 workers-sdk#10755에서 직접 제시, wrangler 기본 번들링 유지 가능. (2) `no_bundle` + `bun build --target=bun` — 동작하지만 번들러 이중화로 복잡도 증가. (3) wrangler `alias` — defuddle 내부 import에 적용되지 않아 불가. postinstall 패치는 임시방편으로 불채택.
- 결과: 성공 — 로컬(`wrangler dev`) + 프로덕션(`wrangler deploy`) 모두 YouTube transcript 정상 추출 확인
