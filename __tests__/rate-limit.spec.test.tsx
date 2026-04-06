import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/extract/route";

vi.mock("@/lib/extract", () => ({
  extractContent: vi.fn().mockResolvedValue({
    title: "Example Page",
    content: "Hello world",
    type: "webpage",
  }),
}));

function makeRequest(url: string, ip: string = "127.0.0.1"): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ url }),
  });
}

describe("Rate Limit spec tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // RATE-001
  describe("RATE-001: 정상 범위 요청은 200을 반환한다", () => {
    it("requestCountInWindow: 0 — 첫 번째 요청이 200을 반환한다", async () => {
      const request = makeRequest("https://example.com/article", "10.0.0.1");
      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
    });

    it("requestCountInWindow: 9 — 10번째 요청이 200을 반환한다", async () => {
      const ip = "10.0.0.2";

      // 9번 요청 (1~9번째)
      for (let i = 0; i < 9; i++) {
        const req = makeRequest("https://example.com/article", ip);
        await POST(req as Parameters<typeof POST>[0]);
      }

      // 10번째 요청
      const request = makeRequest("https://example.com/article", ip);
      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
    });
  });

  // RATE-002
  describe("RATE-002: 10회 초과 요청 시 429와 인라인 에러를 반환한다", () => {
    it("requestCountInWindow: 10 — 11번째 요청이 429와 '요청이 너무 많습니다. 60초 후 다시 시도해주세요'를 반환한다", async () => {
      const ip = "10.0.0.3";

      // 10번 요청 소진
      for (let i = 0; i < 10; i++) {
        const req = makeRequest("https://example.com/article", ip);
        await POST(req as Parameters<typeof POST>[0]);
      }

      // 11번째 요청
      const request = makeRequest("https://example.com/article", ip);
      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json).toHaveProperty("error", "요청이 너무 많습니다. 60초 후 다시 시도해주세요");
    });

    it("requestCountInWindow: 10, elapsedSeconds: 30 — 11번째 요청이 429와 '요청이 너무 많습니다. 30초 후 다시 시도해주세요'를 반환한다", async () => {
      const ip = "10.0.0.4";

      // 10번 요청 소진
      for (let i = 0; i < 10; i++) {
        const req = makeRequest("https://example.com/article", ip);
        await POST(req as Parameters<typeof POST>[0]);
      }

      // 30초 경과
      vi.advanceTimersByTime(30_000);

      // 11번째 요청
      const request = makeRequest("https://example.com/article", ip);
      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json).toHaveProperty("error", "요청이 너무 많습니다. 30초 후 다시 시도해주세요");
    });
  });

  // RATE-003
  describe("RATE-003: 60초 경과 후 정상 응답을 반환한다", () => {
    it("10회 소진 후 60초 경과 시 200을 반환한다", async () => {
      const ip = "10.0.0.5";

      // 10번 요청 소진
      for (let i = 0; i < 10; i++) {
        const req = makeRequest("https://example.com/article", ip);
        await POST(req as Parameters<typeof POST>[0]);
      }

      // 60초 경과
      vi.advanceTimersByTime(60_000);

      // 새 요청
      const request = makeRequest("https://example.com/article", ip);
      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
    });
  });

  // RATE-004
  describe("RATE-004: IP별로 rate limit이 독립적으로 적용된다", () => {
    it("IP-A가 10회 소진해도 IP-B는 200을 반환한다", async () => {
      const ipA = "10.0.0.6";
      const ipB = "10.0.0.7";

      // IP-A: 10번 소진
      for (let i = 0; i < 10; i++) {
        const req = makeRequest("https://example.com/article", ipA);
        await POST(req as Parameters<typeof POST>[0]);
      }

      // IP-A 차단 확인
      const blockedRequest = makeRequest("https://example.com/article", ipA);
      const blockedResponse = await POST(blockedRequest as Parameters<typeof POST>[0]);
      expect(blockedResponse.status).toBe(429);

      // IP-B는 정상
      const request = makeRequest("https://example.com/article", ipB);
      const response = await POST(request as Parameters<typeof POST>[0]);

      expect(response.status).toBe(200);
    });
  });
});
