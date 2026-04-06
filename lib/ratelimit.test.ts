import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  resetRateLimitStore,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
} from "./ratelimit";

const TEST_IP = "1.2.3.4";
const OTHER_IP = "5.6.7.8";

describe("checkRateLimit - 허용 범위 내 요청", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(`1~${RATE_LIMIT_MAX_REQUESTS}회 요청은 모두 { allowed: true }를 반환한다`, () => {
    for (let i = 1; i <= RATE_LIMIT_MAX_REQUESTS; i++) {
      const result = checkRateLimit(TEST_IP);
      expect(result).toEqual({ allowed: true });
    }
  });
});

describe("checkRateLimit - 한도 초과 요청", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(`${RATE_LIMIT_MAX_REQUESTS + 1}번째 요청은 { allowed: false, retryAfter: 60 }을 반환한다`, () => {
    // 10회 소진
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      checkRateLimit(TEST_IP);
    }

    // 11번째 요청
    const result = checkRateLimit(TEST_IP);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(60);
  });

  it("30초 경과 후 요청 시 retryAfter가 30을 반환한다", () => {
    // 10회 소진
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      checkRateLimit(TEST_IP);
    }

    // 30초 경과
    vi.advanceTimersByTime(30_000);

    const result = checkRateLimit(TEST_IP);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(30);
  });
});

describe("checkRateLimit - 윈도우 리셋", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("60초 경과 후 요청 시 윈도우가 리셋되어 { allowed: true }를 반환한다", () => {
    // 10회 소진
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      checkRateLimit(TEST_IP);
    }

    // 60초 + 1ms 경과 (윈도우 완전히 지남)
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

    const result = checkRateLimit(TEST_IP);
    expect(result).toEqual({ allowed: true });
  });
});

describe("checkRateLimit - IP 독립성", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("IP-A가 10회 소진해도 IP-B는 { allowed: true }를 반환한다", () => {
    // IP-A 10회 소진
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      checkRateLimit(TEST_IP);
    }

    // IP-A는 차단
    const blockedResult = checkRateLimit(TEST_IP);
    expect(blockedResult.allowed).toBe(false);

    // IP-B는 허용
    const allowedResult = checkRateLimit(OTHER_IP);
    expect(allowedResult).toEqual({ allowed: true });
  });
});
