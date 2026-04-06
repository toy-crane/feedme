import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/extract/route";
import { resetRateLimitStore } from "@/lib/ratelimit";

vi.mock("@/lib/extract", () => ({
  extractContent: vi.fn().mockResolvedValue({
    title: "Example Page",
    content: "Hello world",
    type: "webpage",
  }),
}));

const TEST_URL = "https://example.com/article";
const TEST_IP = "1.2.3.4";

function makeRequest(ip: string = TEST_IP): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ url: TEST_URL }),
  });
}

async function exhaustLimit(ip: string, count = 10) {
  for (let i = 0; i < count; i++) {
    await POST(makeRequest(ip) as Parameters<typeof POST>[0]);
  }
}

describe("Rate Limit spec tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // RATE-001
  describe("RATE-001: 정상 범위 요청은 200을 반환한다", () => {
    it("requestCountInWindow: 0 — 첫 번째 요청이 200을 반환한다", async () => {
      const response = await POST(makeRequest() as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);
    });

    it("requestCountInWindow: 9 — 10번째 요청이 200을 반환한다", async () => {
      await exhaustLimit(TEST_IP, 9);
      const response = await POST(makeRequest() as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);
    });
  });

  // RATE-002
  describe("RATE-002: 10회 초과 요청 시 429와 인라인 에러를 반환한다", () => {
    it("requestCountInWindow: 10 — 11번째 요청이 429와 '요청이 너무 많습니다. 60초 후 다시 시도해주세요'를 반환한다", async () => {
      await exhaustLimit(TEST_IP);
      const response = await POST(makeRequest() as Parameters<typeof POST>[0]);

      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json).toHaveProperty("error", "요청이 너무 많습니다. 60초 후 다시 시도해주세요");
    });

    it("requestCountInWindow: 10, elapsedSeconds: 30 — 11번째 요청이 429와 '요청이 너무 많습니다. 30초 후 다시 시도해주세요'를 반환한다", async () => {
      await exhaustLimit(TEST_IP);
      vi.advanceTimersByTime(30_000);

      const response = await POST(makeRequest() as Parameters<typeof POST>[0]);

      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json).toHaveProperty("error", "요청이 너무 많습니다. 30초 후 다시 시도해주세요");
    });
  });

  // RATE-003
  describe("RATE-003: 60초 경과 후 정상 응답을 반환한다", () => {
    it("10회 소진 후 60초 경과 시 200을 반환한다", async () => {
      await exhaustLimit(TEST_IP);
      vi.advanceTimersByTime(60_000);

      const response = await POST(makeRequest() as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);
    });
  });

  // RATE-004
  describe("RATE-004: IP별로 rate limit이 독립적으로 적용된다", () => {
    it("IP-A가 10회 소진해도 IP-B는 200을 반환한다", async () => {
      const ipA = "10.0.0.1";
      const ipB = "10.0.0.2";

      await exhaustLimit(ipA);
      const blockedResponse = await POST(makeRequest(ipA) as Parameters<typeof POST>[0]);
      expect(blockedResponse.status).toBe(429);

      const response = await POST(makeRequest(ipB) as Parameters<typeof POST>[0]);
      expect(response.status).toBe(200);
    });
  });
});
