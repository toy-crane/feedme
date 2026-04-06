# Rate Limit 구현 계획

## Architecture Decisions

| 결정 사항 | 선택 | 사유 |
|-----------|------|------|
| 저장소 | 인메모리 Map | 외부 의존성 없이 현재 규모에 적합. 추후 Redis로 교체 가능하도록 인터페이스 분리 |
| Rate limit 위치 | API route 내부 | 엔드포인트가 1개뿐이므로 미들웨어 대비 단순함 |
| IP 추출 | x-forwarded-for > x-real-ip > "unknown" | Vercel/프록시 환경 호환 |
| 알고리즘 | Fixed window | 구현 단순, 1분 윈도우에 충분 |
| 클라이언트 변경 | 없음 | 기존 에러 UI가 429 응답의 error 메시지를 그대로 표시 |

## Data Model

### RateLimitEntry
- timestamps: number[] (윈도우 내 요청 타임스탬프 배열)

## Required Skills

| 스킬 | 적용 Task | 용도 |
|------|-----------|------|
| next-best-practices | Task 3 | Route Handler 에러 응답 패턴 |

## Affected Files

| 파일 경로 | 변경 유형 | 관련 Task |
|-----------|----------|-----------|
| `__tests__/rate-limit.spec.test.tsx` | 신규 | Task 1 |
| `lib/ratelimit.ts` | 신규 | Task 2 |
| `lib/ratelimit.test.ts` | 신규 | Task 2 |
| `app/api/extract/route.ts` | 수정 | Task 3 |
| `app/api/extract/route.test.ts` | 수정 | Task 3 |

## Tasks

### Task 1: Spec 테스트 작성

- **시나리오**: RATE-001, RATE-002, RATE-003, RATE-004
- **의존성**: 없음
- **참조**:
  - `__tests__/feedme.spec.test.tsx` — 기존 spec 테스트 패턴 참조
- **구현 대상**:
  - `__tests__/rate-limit.spec.test.tsx`
    - RATE-001: 첫 번째 요청과 10번째 요청이 정상 응답
    - RATE-002: 11번째 요청이 429 응답 + 에러 메시지에 남은 초 포함
    - RATE-003: 60초 경과 후 요청이 정상 응답
    - RATE-004: 다른 IP의 요청이 독립적으로 정상 처리
- **수용 기준**:
  - [ ] 모든 spec 테스트가 Red 상태 (구현 전이므로 실패)
  - [ ] 각 테스트가 spec.yaml의 given/when/then을 검증

---

### Task 2: Rate limiter 모듈 구현

- **시나리오**: RATE-001, RATE-002, RATE-003, RATE-004
- **의존성**: Task 1 (spec 테스트가 먼저 존재해야 함)
- **구현 대상**:
  - `lib/ratelimit.ts`
    - `checkRateLimit(ip: string)` 함수: `{ allowed: boolean, retryAfter?: number }` 반환
    - IP별 요청 타임스탬프를 Map으로 관리
    - 윈도우(60초) 밖의 오래된 타임스탬프 자동 정리
    - 상수: `RATE_LIMIT_WINDOW_MS = 60_000`, `RATE_LIMIT_MAX_REQUESTS = 10`
  - `lib/ratelimit.test.ts`
    - 허용 범위 내 요청 -> allowed: true
    - 초과 요청 -> allowed: false, retryAfter에 남은 초
    - 윈도우 경과 후 -> allowed: true
    - IP 독립성 검증
- **수용 기준**:
  - [ ] `bun run test lib/ratelimit.test.ts` 통과
  - [ ] `checkRateLimit("1.2.3.4")` 10회 호출 -> 모두 `{ allowed: true }`
  - [ ] 11번째 호출 -> `{ allowed: false, retryAfter: 60 }`

---

### Task 3: API route에 rate limit 적용

- **시나리오**: RATE-001, RATE-002, RATE-003, RATE-004
- **의존성**: Task 2 (rate limiter 모듈이 구현되어야 함)
- **참조**:
  - next-best-practices — Route Handler 에러 응답 패턴
- **구현 대상**:
  - `app/api/extract/route.ts`
    - request에서 IP 추출 (x-forwarded-for > x-real-ip > "unknown")
    - `extractContent` 호출 전에 `checkRateLimit(ip)` 호출
    - 차단 시 429 응답: `{ error: "요청이 너무 많습니다. N초 후 다시 시도해주세요" }`
  - `app/api/extract/route.test.ts`
    - rate limit 미초과 시 정상 응답 테스트
    - rate limit 초과 시 429 응답 + 에러 메시지 테스트
- **수용 기준**:
  - [ ] `bun run test app/api/extract/route.test.ts` 통과
  - [ ] `bun run test __tests__/rate-limit.spec.test.tsx` 모든 spec 테스트 통과 (Green)
  - [ ] `bun run test` 전체 테스트 통과

---

## 미결정 사항

없음
