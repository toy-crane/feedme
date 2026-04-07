import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp, getRateLimitKey, DAILY_RATE_LIMIT } from "../src/ratelimit";

// In-memory KV mock
function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list() {
      return { keys: [], list_complete: true, cursor: undefined };
    },
    async getWithMetadata(key: string) {
      const value = store.get(key) ?? null;
      return { value, metadata: null };
    },
  } as unknown as KVNamespace;
}

describe("getClientIp", () => {
  it("cf-connecting-ip 헤더에서 IP를 반환한다", () => {
    const request = new Request("https://example.com", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("cf-connecting-ip가 없으면 x-forwarded-for 첫 번째 IP를 반환한다", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "5.6.7.8, 9.10.11.12" },
    });
    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("헤더가 없으면 'unknown'을 반환한다", () => {
    const request = new Request("https://example.com");
    expect(getClientIp(request)).toBe("unknown");
  });
});

describe("getRateLimitKey", () => {
  it("rate:{ip}:{YYYY-MM-DD} 형식의 키를 반환한다", () => {
    const key = getRateLimitKey("1.2.3.4");
    expect(key).toMatch(/^rate:1\.2\.3\.4:\d{4}-\d{2}-\d{2}$/);
  });

  it("오늘 UTC 날짜를 포함한다", () => {
    const expectedDate = new Date().toISOString().slice(0, 10);
    const key = getRateLimitKey("1.2.3.4");
    expect(key).toBe(`rate:1.2.3.4:${expectedDate}`);
  });
});

describe("checkRateLimit", () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
  });

  it("첫 요청은 allowed: true를 반환한다", async () => {
    const result = await checkRateLimit("1.2.3.4", kv);
    expect(result.allowed).toBe(true);
  });

  it(`${DAILY_RATE_LIMIT}번째 요청까지 allowed: true를 반환한다`, async () => {
    for (let i = 0; i < DAILY_RATE_LIMIT - 1; i++) {
      await checkRateLimit("1.2.3.4", kv);
    }
    const result = await checkRateLimit("1.2.3.4", kv);
    expect(result.allowed).toBe(true);
  });

  it(`${DAILY_RATE_LIMIT + 1}번째 요청은 allowed: false를 반환한다`, async () => {
    for (let i = 0; i < DAILY_RATE_LIMIT; i++) {
      await checkRateLimit("1.2.3.4", kv);
    }
    const result = await checkRateLimit("1.2.3.4", kv);
    expect(result.allowed).toBe(false);
  });

  it("다른 IP는 독립적으로 카운트한다 - IP-A 소진 후 IP-B는 allowed: true", async () => {
    for (let i = 0; i < DAILY_RATE_LIMIT; i++) {
      await checkRateLimit("1.2.3.4", kv);
    }
    const resultA = await checkRateLimit("1.2.3.4", kv);
    expect(resultA.allowed).toBe(false);

    const resultB = await checkRateLimit("9.9.9.9", kv);
    expect(resultB.allowed).toBe(true);
  });
});
