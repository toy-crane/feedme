## Overview
Vercel 데이터센터 IP가 YouTube에 의해 차단되어 콘텐츠 추출 API가 동작하지 않는 문제를 해결하기 위해, 기존 Next.js API route(`/api/extract`)를 Cloudflare Worker로 이전한다. defuddle 레포지토리의 구현을 참고하여 Worker를 작성하고, 프론트엔드는 Worker 엔드포인트를 직접 호출하도록 변경한다.

## 시나리오

### 1. 웹페이지 콘텐츠 추출 (Worker 경유)
[상황] 프론트엔드에서 웹페이지 URL로 추출 요청을 보내면
[동작] Cloudflare Worker가 defuddle을 사용하여 콘텐츠를 마크다운으로 추출하고, 제목/본문/출처/썸네일을 포함한 JSON 응답을 반환한다

성공 기준:
- [ ] 웹페이지 URL 요청 -> 200 응답, title/content/type("webpage")/source/thumbnail 필드 포함
- [ ] author 메타가 있으면 source에 author, 없으면 도메인명 반환
- [ ] OG 이미지가 있으면 thumbnail 필드에 포함

### 2. YouTube 콘텐츠 추출 (Worker 경유)
[상황] 프론트엔드에서 YouTube URL로 추출 요청을 보내면
[동작] Cloudflare Worker가 defuddle을 사용하여 영상 제목, 채널명, 자막을 마크다운으로 추출하여 반환한다

성공 기준:
- [ ] YouTube URL 요청 -> 200 응답, type("youtube"), title, content(자막), source(채널명), thumbnail 포함
- [ ] "## Transcript" 헤딩이 제거된 상태로 반환
- [ ] 자막이 50자 이하(이미지 마크다운 제외)이면 422 응답, "자막을 찾을 수 없습니다"

### 3. 에러 처리
[상황] 잘못된 URL이나 접근 불가능한 URL로 요청하면
[동작] 기존과 동일한 에러 메시지와 HTTP 상태 코드를 반환한다

성공 기준:
- [ ] 잘못된 URL -> 400, "올바른 URL을 입력해주세요"
- [ ] 접근 불가 URL -> 502, "페이지에 접근할 수 없습니다"
- [ ] 자막 없는 YouTube -> 422, "자막을 찾을 수 없습니다"
- [ ] 알 수 없는 오류 -> 500, "알 수 없는 오류가 발생했습니다"

### 4. Rate Limiting (KV 기반, 일 100회/IP)
[상황] 동일 IP에서 하루 100회를 초과하여 요청하면
[동작] 429 응답과 함께 "요청 한도를 초과했습니다. 내일 다시 시도해주세요" 에러를 반환한다

성공 기준:
- [ ] 하루 첫 요청 -> 정상 응답 (200)
- [ ] 하루 100번째 요청 -> 정상 응답 (200)
- [ ] 하루 101번째 요청 -> 429, "요청 한도를 초과했습니다. 내일 다시 시도해주세요"
- [ ] 다음 날(UTC 기준) -> 요청 카운트 리셋, 정상 응답 (200)
- [ ] IP-A가 100회 소진 -> IP-B의 요청은 정상 처리

### 5. CORS 처리
[상황] 프론트엔드가 Worker 엔드포인트에 cross-origin 요청을 보내면
[동작] 허용된 origin에 대해 CORS 헤더를 포함하여 응답한다

성공 기준:
- [ ] 허용된 origin에서의 요청 -> Access-Control-Allow-Origin 헤더 포함
- [ ] OPTIONS preflight 요청 -> 204 응답, 적절한 CORS 헤더 포함
- [ ] 허용되지 않은 origin -> CORS 헤더 미포함

### 6. 에지 캐싱 (1시간)
[상황] 동일한 URL로 추출 요청이 반복되면
[동작] Workers Cache API를 사용하여 캐시된 응답을 반환하고, 응답에 s-maxage=3600을 설정한다

성공 기준:
- [ ] 첫 요청 -> Worker가 외부 사이트를 fetch하여 추출하고, 캐시에 저장 후 응답
- [ ] 동일 URL 재요청 -> 캐시에서 즉시 응답 (Worker 추출 로직 미실행)
- [ ] 응답 Cache-Control에 s-maxage=3600이 설정되어 있다
- [ ] 캐시 히트 시에도 rate limit 카운트는 증가한다

### 7. 프론트엔드 API 호출 변경
[상황] 사용자가 URL을 입력하고 '가져오기' 버튼을 클릭하면
[동작] 프론트엔드가 Worker 엔드포인트로 요청을 보내고, 기존과 동일한 UX를 제공한다

성공 기준:
- [ ] 환경변수 NEXT_PUBLIC_EXTRACT_API_URL로 Worker URL을 설정
- [ ] 추출 성공 -> 기존과 동일하게 마크다운 미리보기 표시
- [ ] 추출 실패 -> 기존과 동일한 인라인 에러 표시
- [ ] Worker 호출 자체 실패 (네트워크 오류) -> "네트워크 오류가 발생했습니다"

## 범위

### 포함
- `workers/extract/` 디렉토리에 Cloudflare Worker 프로젝트 생성
- defuddle 기반 콘텐츠 추출 로직 (defuddle 레포 참고)
- Cloudflare KV 기반 IP rate limiting (일 100회)
- CORS 처리
- Workers Cache API 기반 에지 캐싱 (1시간 TTL)
- 프론트엔드 API 호출 URL 변경 (`use-extract.ts`)
- 기존 Next.js API route 제거 (`app/api/extract/`)
- 기존 서버 전용 모듈 제거 (`lib/extract.ts`, `lib/ratelimit.ts`)

### 제외
- Burst 방지 (분 단위 제한) — 일 100회 총량 제한으로 충분
- API 키 인증 — MVP 범위 외
- Durable Objects — KV로 충분한 정확도

## 전제 조건
- Cloudflare 계정 (Free plan)
- wrangler CLI 설치
- KV 네임스페이스 생성

## 미결정 사항
- 없음
