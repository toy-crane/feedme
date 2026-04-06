import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/extract", () => ({
  extractContent: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

import { extractContent } from "@/lib/extract";
import { checkRateLimit } from "@/lib/ratelimit";

const mockExtractContent = vi.mocked(extractContent);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true });
  });

  it("정상 요청 시 200과 ExtractResult를 반환한다", async () => {
    const mockResult = {
      title: "Example Page",
      content: "Hello world",
      type: "webpage" as const,
    };
    mockExtractContent.mockResolvedValue(mockResult);

    const request = makeRequest({ url: "https://example.com" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(mockResult);
  });

  it("빈 URL이면 400과 에러 메시지를 반환한다", async () => {
    mockExtractContent.mockRejectedValue(
      new Error("올바른 URL을 입력해주세요")
    );

    const request = makeRequest({ url: "" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toHaveProperty("error", "올바른 URL을 입력해주세요");
  });

  it("페이지 접근 불가 시 502와 에러 메시지를 반환한다", async () => {
    mockExtractContent.mockRejectedValue(
      new Error("페이지에 접근할 수 없습니다")
    );

    const request = makeRequest({ url: "https://unreachable.example.com" });
    const response = await POST(request);

    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json).toHaveProperty("error", "페이지에 접근할 수 없습니다");
  });

  it("자막 없음 시 422와 에러 메시지를 반환한다", async () => {
    mockExtractContent.mockRejectedValue(
      new Error("자막을 찾을 수 없습니다")
    );

    const request = makeRequest({ url: "https://www.youtube.com/watch?v=abc" });
    const response = await POST(request);

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json).toHaveProperty("error", "자막을 찾을 수 없습니다");
  });

  it("알 수 없는 에러 시 500을 반환한다", async () => {
    mockExtractContent.mockRejectedValue(new Error("Unexpected failure"));

    const request = makeRequest({ url: "https://example.com" });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toHaveProperty("error", "Unexpected failure");
  });

  it("checkRateLimit가 allowed:false를 반환하면 429와 에러 메시지를 반환한다", async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfter: 45 });

    const request = makeRequest({ url: "https://example.com" });
    const response = await POST(request);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json).toHaveProperty("error", "요청이 너무 많습니다. 45초 후 다시 시도해주세요");
  });
});
