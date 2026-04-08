import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useExtract } from "@/hooks/use-extract";

function defuddleResponse(content: string, meta: Record<string, string> = {}) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(meta)) {
    lines.push(`${k}: "${v}"`);
  }
  lines.push("---");
  return `${lines.join("\n")}\n\n${content}`;
}

describe("useExtract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("초기 상태가 올바르다", () => {
    const { result } = renderHook(() => useExtract());

    expect(result.current.url).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.markdownText).toBeNull();
  });

  it("setUrl로 URL을 변경한다", () => {
    const { result } = renderHook(() => useExtract());

    act(() => result.current.setUrl("https://example.com"));

    expect(result.current.url).toBe("https://example.com");
  });

  it("handleFetch 성공 시 result가 설정되고 loading이 false로 돌아온다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => defuddleResponse("# Hello", { title: "Test" }),
    });

    const { result } = renderHook(() => useExtract());

    act(() => result.current.setUrl("https://example.com"));
    await act(() => result.current.handleFetch());

    expect(result.current.result?.title).toBe("Test");
    expect(result.current.markdownText).toBe("# Hello");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handleFetch 서버 에러 시 error가 설정된다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: "페이지에 접근할 수 없습니다" }),
    });

    const { result } = renderHook(() => useExtract());

    await act(() => result.current.handleFetch());

    expect(result.current.error).toBe("페이지에 접근할 수 없습니다");
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("handleFetch 네트워크 에러 시 error가 설정된다", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useExtract());

    await act(() => result.current.handleFetch());

    expect(result.current.error).toBe("네트워크 오류가 발생했습니다");
    expect(result.current.loading).toBe(false);
  });

  it("frontmatter 없는 plain markdown도 content로 파싱된다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "plain markdown content",
    });

    const { result } = renderHook(() => useExtract());

    await act(() => result.current.handleFetch());

    expect(result.current.markdownText).toBe("plain markdown content");
  });

  it("reset 호출 시 모든 상태가 초기화된다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => defuddleResponse("# Hello", { title: "Test" }),
    });

    const { result } = renderHook(() => useExtract());

    act(() => result.current.setUrl("https://example.com"));
    await act(() => result.current.handleFetch());

    expect(result.current.result).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.url).toBe("");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
