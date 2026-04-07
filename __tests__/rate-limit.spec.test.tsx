/**
 * Rate Limit spec tests
 *
 * NOTE: 기존 rate limit은 Next.js API route + 인메모리 store 기반이었다.
 * 새 rate limit은 Cloudflare KV 기반이므로 Worker 프로젝트 내에서 테스트해야 한다.
 *
 * Worker 프로젝트 생성 후 이 파일의 시나리오는
 * workers/extract/test/ratelimit.test.ts 로 이동 예정.
 *
 * ─────────────────────────────────────────────────────────────────
 * 커버해야 하는 시나리오 (workers/extract/test/ratelimit.test.ts 작성 시 참고)
 * ─────────────────────────────────────────────────────────────────
 *
 * RATE-001: 정상 범위 요청은 200을 반환한다
 *   - dailyRequestCount: 0  → 첫 번째 요청이 200을 반환한다
 *   - dailyRequestCount: 99 → 100번째 요청이 200을 반환한다
 *
 * RATE-002: 일 100회 초과 요청 시 429와 인라인 에러를 반환한다
 *   - dailyRequestCount: 100 → 101번째 요청이 429와
 *     "요청 한도를 초과했습니다. 내일 다시 시도해주세요"를 반환한다
 *   (이전 인메모리 구현의 분 단위 Retry-After와 달리, KV 기반은 일 단위 초기화)
 *
 * RATE-003: 날짜가 변경되면 rate limit이 초기화된다
 *   - yesterdayRequestCount: 100, todayRequestCount: 0
 *     → 새 날짜(UTC 기준) 첫 번째 요청이 200을 반환한다
 *   (KV key에 날짜를 포함하여 자동 초기화)
 *
 * RATE-004: IP별로 rate limit이 독립적으로 적용된다
 *   - IP-A가 100회 소진해도 IP-B는 200을 반환한다
 *   (KV key: `ratelimit:{ip}:{date}` 형태)
 *
 * ─────────────────────────────────────────────────────────────────
 * 구현 가이드 (Worker 코드 작성 시 참고)
 * ─────────────────────────────────────────────────────────────────
 *
 * KV key 형태: `ratelimit:{ip}:{YYYY-MM-DD}`  (UTC 날짜)
 * 한도: 100회/일/IP
 * 초과 시: { error: "요청 한도를 초과했습니다. 내일 다시 시도해주세요" }
 * TTL: 48시간 (다음 날 이후 자동 삭제)
 */

import { describe, it } from "vitest";

describe("Rate Limit spec tests", () => {
  // Worker 프로젝트 생성 후 workers/extract/test/ratelimit.test.ts 로 이동 예정.
  // 아래 시나리오들은 Cloudflare Workers 환경(miniflare 또는 wrangler dev)에서 테스트한다.

  describe("RATE-001: 정상 범위 요청은 200을 반환한다", () => {
    it.todo("dailyRequestCount: 0 — 첫 번째 요청이 200을 반환한다");
    it.todo("dailyRequestCount: 99 — 100번째 요청이 200을 반환한다");
  });

  describe("RATE-002: 일 100회 초과 요청 시 429와 인라인 에러를 반환한다", () => {
    it.todo(
      "dailyRequestCount: 100 — 101번째 요청이 429와 '요청 한도를 초과했습니다. 내일 다시 시도해주세요'를 반환한다"
    );
  });

  describe("RATE-003: 날짜 변경 후 rate limit이 초기화된다", () => {
    it.todo(
      "yesterdayRequestCount: 100, todayRequestCount: 0 — 새 날짜 첫 요청이 200을 반환한다"
    );
  });

  describe("RATE-004: IP별로 rate limit이 독립적으로 적용된다", () => {
    it.todo("IP-A가 100회 소진해도 IP-B는 200을 반환한다");
  });
});
