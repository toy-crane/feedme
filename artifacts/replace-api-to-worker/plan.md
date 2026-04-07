# replace-api-to-worker 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| Worker 프로젝트 위치 | `workers/extract/` | 모노레포 아닌 프로젝트에서도 독립 빌드/배포 가능 |
| DOM 파서 | linkedom | defuddle이 사용, Workers 호환 (jsdom 불가) |
| Rate limit 저장소 | Cloudflare KV | Free plan 포함, defuddle과 동일 패턴 |
| Rate limit 윈도우 | 일 100회/IP (UTC 기준) | Free plan KV write 한도 내 운영 가능 |
| 호환성 플래그 | nodejs_compat | linkedom이 Node.js API 필요 |
| defuddle 사용 방식 | npm 패키지 | defuddle 레포는 로컬 import, 우리는 npm 패키지로 설치 |
| 에지 캐싱 | Workers Cache API, 1시간 TTL | 콘텐츠 추출은 읽기 전용, 중복 요청 방어 및 Workers 요청 수 절약 |
| 프론트엔드 API URL | NEXT_PUBLIC_EXTRACT_API_URL 환경변수 | 배포 환경별 Worker URL 분리 |

## Data Model

### KV Rate Limit Entry
- key: `rate:{ip}:{YYYY-MM-DD}` (string)
- value: 요청 카운트 (number as string)
- TTL: 24시간 자동 만료

### ExtractResult (Worker 응답, 기존과 동일)
- title (string, required)
- content (string, required)
- type ("webpage" | "youtube", required)
- source (string, optional)
- thumbnail (string, optional)

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| workers-best-practices | Task 2, 3, 4 | Worker 코드 작성 및 wrangler 설정 모범 사례 |
| cloudflare | Task 2 | Workers 플랫폼, KV 설정 |
| next-best-practices | Task 6 | 환경변수 활용, API 호출 패턴 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `workers/extract/wrangler.jsonc` | 신규 | Task 2 |
| `workers/extract/package.json` | 신규 | Task 2 |
| `workers/extract/tsconfig.json` | 신규 | Task 2 |
| `workers/extract/src/index.ts` | 신규 | Task 3, 4, 5 |
| `workers/extract/src/extract.ts` | 신규 | Task 3 |
| `workers/extract/src/ratelimit.ts` | 신규 | Task 4 |
| `workers/extract/src/cors.ts` | 신규 | Task 5 |
| `workers/extract/src/types.ts` | 신규 | Task 3 |
| `workers/extract/test/extract.test.ts` | 신규 | Task 3 |
| `workers/extract/test/ratelimit.test.ts` | 신규 | Task 4 |
| `workers/extract/test/cors.test.ts` | 신규 | Task 5 |
| `workers/extract/src/cache.ts` | 신규 | Task 5.1 |
| `workers/extract/test/cache.test.ts` | 신규 | Task 5.1 |
| `__tests__/replace-api-to-worker.spec.test.tsx` | 신규 | Task 1 |
| `__tests__/rate-limit.spec.test.tsx` | 전체 교체 | Task 1 |
| `hooks/use-extract.ts` | 수정 | Task 6 |
| `.env.local` | 수정 | Task 6 |
| `.env.example` | 수정 | Task 6 |
| `app/api/extract/` | 삭제 | Task 7 |
| `lib/extract.ts` | 삭제 | Task 7 |
| `lib/ratelimit.ts` | 삭제 | Task 7 |
| `app/api/extract/route.test.ts` | 삭제 | Task 7 |
| `lib/extract.test.ts` | 삭제 | Task 7 |
| `lib/ratelimit.test.ts` | 삭제 | Task 7 |

## Tasks

### Task 1: Spec 테스트 작성

- **시나리오**: WORKER-001 ~ WORKER-006, RATE-001 ~ RATE-004
- **의존성**: 없음
- **참조**:
  - 기존 `__tests__/rate-limit.spec.test.tsx` — 현재 rate limit 테스트 구조 참고
  - 기존 `__tests__/feedme.spec.test.tsx` — 프론트엔드 spec 테스트 구조 참고
- **구현 대상**:
  - `__tests__/replace-api-to-worker.spec.test.tsx`
    - WORKER-001: 웹페이지 추출 → 200, type "webpage", title/content/source/thumbnail
    - WORKER-002: YouTube 추출 → 200, type "youtube", Transcript 헤딩 제거
    - WORKER-003: 에러 응답 (400, 502, 422, 500)
    - WORKER-004: CORS 헤더 (허용 origin, preflight, 비허용 origin)
    - WORKER-005: 프론트엔드가 Worker URL로 요청, 성공/에러/네트워크 오류
    - WORKER-006: 에지 캐싱 (1시간 이내 캐시 히트, 만료 후 재fetch, 캐시 히트 시에도 rate limit 증가)
  - `__tests__/rate-limit.spec.test.tsx` (전체 교체 — 기존 import가 삭제될 모듈을 참조하므로)
    - RATE-001 ~ RATE-004를 일 100회/IP, KV 기반으로 재작성
    - Worker 핸들러를 직접 호출하거나 KV mock으로 테스트
- **수용 기준**:
  - [ ] 모든 spec 테스트가 RED 상태 (구현 전이므로 실패)
  - [ ] 각 시나리오 ID가 테스트 describe에 명시되어 있다

---

### Task 2: Worker 프로젝트 초기 설정

- **시나리오**: WORKER-001 (전제 조건)
- **의존성**: 없음
- **참조**:
  - workers-best-practices — wrangler.jsonc, nodejs_compat, KV binding
  - cloudflare — Workers 프로젝트 구조
  - `bunx create-cloudflare workers/extract` — 프로젝트 스캐폴딩
  - defuddle 레포 `website/wrangler.toml` — KV 네임스페이스 바인딩 패턴
- **구현 대상**:
  - `workers/extract/wrangler.jsonc`
    - name: "feedme-extract"
    - main: "src/index.ts"
    - compatibility_flags: ["nodejs_compat"]
    - KV namespace binding: RATE_LIMIT
  - `workers/extract/package.json`
    - dependencies: defuddle, linkedom
    - devDependencies: wrangler, @cloudflare/workers-types, vitest, @cloudflare/vitest-pool-workers
  - `workers/extract/tsconfig.json`
    - Workers 타입 포함
- **수용 기준**:
  - [ ] `cd workers/extract && bun install` 성공
  - [ ] `cd workers/extract && bunx wrangler types` 성공 (타입 생성)

---

### Task 3: 콘텐츠 추출 로직 구현

- **시나리오**: WORKER-001, WORKER-002, WORKER-003
- **의존성**: Task 2 (Worker 프로젝트 설정)
- **참조**:
  - workers-best-practices — fetch 패턴, 에러 처리
  - defuddle 레포 `website/src/convert.ts` — YouTube 특수 처리 (oEmbed + InnerTube)
  - 기존 `lib/extract.ts` — 현재 추출 로직, ExtractResult 인터페이스
- **구현 대상**:
  - `workers/extract/src/types.ts`
    - ExtractResult 인터페이스 (기존과 동일)
  - `workers/extract/src/extract.ts`
    - extractContent(url) 함수 — defuddle/node 사용
    - isYouTubeUrl() 헬퍼
    - hasYouTubeTranscript() 헬퍼
    - 에러 메시지: 기존과 동일한 한국어 메시지
  - `workers/extract/src/index.ts`
    - POST 핸들러: URL 파싱 → extractContent → JSON 응답
    - 에러 매핑: 메시지 → HTTP 상태 코드 (기존과 동일)
  - `workers/extract/test/extract.test.ts`
    - URL 검증, YouTube 감지, 에러 매핑 단위 테스트
- **수용 기준**:
  - [ ] 웹페이지 URL 요청 → 200, type "webpage", author 있으면 source=author, 없으면 source=도메인명
  - [ ] YouTube URL 요청 → 200, type "youtube", Transcript 헤딩 제거
  - [ ] YouTube 자막이 50자 이하(이미지 마크다운 제외) → 422, "자막을 찾을 수 없습니다"
  - [ ] 잘못된 URL → 400, 접근 불가 → 502, 알 수 없는 오류 → 500
  - [ ] Worker 단위 테스트 통과

---

### Task 4: KV 기반 Rate Limiting 구현

- **시나리오**: RATE-001 ~ RATE-004
- **의존성**: Task 2 (KV binding 설정)
- **참조**:
  - workers-best-practices — KV 사용 패턴
  - defuddle 레포 `website/src/index.ts` — KV rate limit 구현 (월 단위)
- **구현 대상**:
  - `workers/extract/src/ratelimit.ts`
    - checkRateLimit(ip, kv) — KV에서 일별 카운트 조회/증가
    - KV 키: `rate:{ip}:{YYYY-MM-DD}`, TTL: 86400초
    - 한도: 100회/일
    - IP 감지: cf-connecting-ip → x-forwarded-for 폴백
  - `workers/extract/src/index.ts`
    - POST 핸들러에 rate limit 체크 추가
    - 429 응답: `{ error: "요청 한도를 초과했습니다. 내일 다시 시도해주세요" }`
  - `workers/extract/test/ratelimit.test.ts`
    - 카운트 증가, 한도 초과, 날짜 리셋, IP 독립성 단위 테스트
- **수용 기준**:
  - [ ] 100회까지 정상 응답 (200)
  - [ ] 101회째 429 + 에러 메시지
  - [ ] 다른 IP는 독립적으로 카운트
  - [ ] Rate limit 단위 테스트 통과

---

### Task 5: CORS 처리 구현

- **시나리오**: WORKER-004
- **의존성**: Task 3 (index.ts 핸들러), Task 4 (rate limit도 index.ts 수정)
- **참조**:
  - workers-best-practices — CORS 패턴
- **구현 대상**:
  - `workers/extract/src/cors.ts`
    - handleCors(request, env) — origin 검증, 헤더 설정
    - ALLOWED_ORIGINS: 환경변수에서 읽기 (개발: localhost, 프로덕션: feedme 도메인)
  - `workers/extract/src/index.ts`
    - OPTIONS → 204 + CORS 헤더
    - POST 응답에 CORS 헤더 추가
    - 비허용 origin → CORS 헤더 미포함
  - `workers/extract/test/cors.test.ts`
    - 허용 origin, preflight, 비허용 origin 단위 테스트
- **수용 기준**:
  - [ ] 허용된 origin → Access-Control-Allow-Origin 포함
  - [ ] OPTIONS → 204 + CORS 헤더
  - [ ] 비허용 origin → CORS 헤더 없음
  - [ ] CORS 단위 테스트 통과

---

### Task 5.1: 에지 캐싱 구현 (1시간 TTL)

- **시나리오**: WORKER-006
- **의존성**: Task 3 (추출 로직이 index.ts에 구현된 후)
- **참조**:
  - workers-best-practices — Workers Cache API 패턴
  - defuddle 레포 `website/src/index.ts` — Cache API 사용 패턴 (s-maxage=300)
- **구현 대상**:
  - `workers/extract/src/cache.ts`
    - URL 기반 캐시 키 생성
    - Workers Cache API (`caches.default`)로 캐시 조회/저장
    - Cache-Control: `s-maxage=3600` (1시간)
  - `workers/extract/src/index.ts`
    - POST 핸들러에 캐시 체크 추가 (rate limit 후, 추출 전)
    - 캐시 히트 → 캐시 응답 반환
    - 캐시 미스 → 추출 후 캐시 저장, `ctx.waitUntil`로 비동기 저장
  - `workers/extract/test/cache.test.ts`
    - 캐시 히트/미스, 캐시 키 생성 단위 테스트 (Miniflare 기반)
    - TTL 만료는 단위 테스트 불가 — Cache-Control 헤더에 s-maxage=3600 설정 여부로 검증
- **수용 기준**:
  - [ ] 첫 요청 → 외부 fetch 후 캐시 저장, 200 응답
  - [ ] 동일 URL 재요청 → 캐시에서 반환 (외부 fetch 미실행)
  - [ ] 캐시 저장 시 Cache-Control에 s-maxage=3600이 설정되어 있다
  - [ ] 캐시 히트 시에도 rate limit 카운트 증가
  - [ ] 캐시 단위 테스트 통과

---

### Task 5.5: defuddle 원본과 구현 Diff 검증

- **시나리오**: WORKER-001, WORKER-002, WORKER-003
- **의존성**: Task 3, 4, 5 (Worker 구현 완료 후)
- **참조**:
  - https://github.com/kepano/defuddle — 원본 레포
- **구현 대상**:
  - defuddle 레포를 `tmp/` 디렉토리에 clone
  - `website/src/index.ts`, `website/src/convert.ts`와 우리 Worker 코드 비교
  - 차이점을 정리하여 누락된 패턴이 없는지 확인:
    - YouTube 특수 처리 (oEmbed + InnerTube bypass)
    - Bot UA fallback
    - 에러 처리 패턴
    - 캐싱 로직
  - 필요한 수정 사항이 있으면 Task 3~5에 반영
  - 검증 완료 후 `tmp/` 정리
- **수용 기준**:
  - [ ] defuddle 원본 코드와 비교한 diff 리포트 작성
  - [ ] YouTube 추출 로직이 defuddle의 InnerTube/oEmbed 패턴을 따르고 있다
  - [ ] 누락된 중요 패턴이 있으면 반영 완료

---

### Task 6: 프론트엔드 API 호출 변경

- **시나리오**: WORKER-005
- **의존성**: Task 3 (Worker 엔드포인트 동작)
- **참조**:
  - next-best-practices — NEXT_PUBLIC 환경변수 패턴
  - 기존 `hooks/use-extract.ts` — 현재 fetch 호출 구조
- **구현 대상**:
  - `hooks/use-extract.ts`
    - fetch URL을 `process.env.NEXT_PUBLIC_EXTRACT_API_URL`로 변경
    - 기존 에러 처리 로직 유지
  - `.env.local`
    - NEXT_PUBLIC_EXTRACT_API_URL 추가 (개발: http://localhost:8787)
  - `.env.example`
    - NEXT_PUBLIC_EXTRACT_API_URL 예시 추가
- **수용 기준**:
  - [ ] 환경변수로 Worker URL 설정 가능
  - [ ] 기존 feedme spec 테스트 (FEEDME-001 ~ FEEDME-012) 통과 유지
  - [ ] 네트워크 오류 시 "네트워크 오류가 발생했습니다" 표시

---

### Task 7: 기존 Next.js API 코드 제거

- **시나리오**: (정리 작업)
- **의존성**: Task 6 (프론트엔드가 Worker를 사용하도록 변경 완료)
- **참조**: 없음
- **구현 대상**:
  - `app/api/extract/` 디렉토리 삭제
  - `lib/extract.ts` 삭제
  - `lib/ratelimit.ts` 삭제
  - `app/api/extract/route.test.ts` 삭제 (있는 경우)
  - `lib/extract.test.ts` 삭제 (있는 경우)
  - `lib/ratelimit.test.ts` 삭제 (있는 경우)
  - `package.json`에서 서버 전용 의존성 제거 (linkedom — Worker 쪽으로 이동)
- **수용 기준**:
  - [ ] `app/api/extract/` 디렉토리가 존재하지 않는다
  - [ ] `lib/extract.ts`, `lib/ratelimit.ts`가 존재하지 않는다
  - [ ] Next.js 빌드 (`bun run build`) 성공
  - [ ] 기존 feedme spec 테스트 (`bun run test`) 통과 유지
  - [ ] Worker 테스트 (`cd workers/extract && bun run test`) 통과 (GREEN)

---

## 미결정 사항

- 없음
