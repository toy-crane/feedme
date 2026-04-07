import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidUrl, isYouTubeUrl, hasYouTubeTranscript, extractContent, getInitialUA } from "../src/extract";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock defuddle/node
vi.mock("defuddle/node", () => ({
  Defuddle: vi.fn(),
}));

// Mock linkedom
vi.mock("linkedom", () => ({
  parseHTML: vi.fn(),
}));

describe("isValidUrl", () => {
  it("유효한 http URL에 대해 true를 반환한다", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("유효한 https URL에 대해 true를 반환한다", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("빈 문자열에 대해 false를 반환한다", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("공백만 있는 경우 false를 반환한다", () => {
    expect(isValidUrl("   ")).toBe(false);
  });

  it("잘못된 형식의 URL에 대해 false를 반환한다", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("ftp URL에 대해 false를 반환한다", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });
});

describe("isYouTubeUrl", () => {
  it("www.youtube.com/watch URL에 대해 true를 반환한다", () => {
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
  });

  it("youtube.com/watch URL에 대해 true를 반환한다", () => {
    expect(isYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
  });

  it("youtu.be URL에 대해 true를 반환한다", () => {
    expect(isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
  });

  it("일반 웹페이지 URL에 대해 false를 반환한다", () => {
    expect(isYouTubeUrl("https://example.com/article")).toBe(false);
  });

  it("youtube.com이지만 /watch가 아닌 경우 false를 반환한다", () => {
    expect(isYouTubeUrl("https://www.youtube.com/channel/UCdkj")).toBe(false);
  });

  it("잘못된 URL에 대해 false를 반환한다", () => {
    expect(isYouTubeUrl("not-a-url")).toBe(false);
  });
});

describe("hasYouTubeTranscript", () => {
  it("50자 초과 텍스트가 있으면 true를 반환한다", () => {
    const content = "이것은 50자를 초과하는 충분히 긴 자막 텍스트입니다. 실제로 꽤 길게 작성했습니다. 조금 더 추가합니다.";
    expect(hasYouTubeTranscript(content)).toBe(true);
  });

  it("50자 이하 텍스트이면 false를 반환한다", () => {
    const content = "짧은 텍스트";
    expect(hasYouTubeTranscript(content)).toBe(false);
  });

  it("빈 문자열이면 false를 반환한다", () => {
    expect(hasYouTubeTranscript("")).toBe(false);
  });

  it("이미지 마크다운만 있으면 false를 반환한다", () => {
    const content = "![thumbnail](https://img.youtube.com/vi/abc/maxresdefault.jpg)";
    expect(hasYouTubeTranscript(content)).toBe(false);
  });

  it("이미지 마크다운 제거 후 50자 이하면 false를 반환한다", () => {
    const content = "![img](https://example.com/img.jpg) 짧음";
    expect(hasYouTubeTranscript(content)).toBe(false);
  });

  it("이미지 마크다운 제거 후 50자 초과면 true를 반환한다", () => {
    const content = "![img](https://example.com/img.jpg) 이것은 이미지 제거 후에도 충분히 긴 자막 텍스트입니다. 길게 작성했습니다. 더 추가합니다.";
    expect(hasYouTubeTranscript(content)).toBe(true);
  });
});

describe("extractContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("잘못된 URL이면 '올바른 URL을 입력해주세요' 에러를 던진다", async () => {
    await expect(extractContent("not-a-url")).rejects.toThrow("올바른 URL을 입력해주세요");
  });

  it("fetch 실패 시 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(extractContent("https://unreachable.invalid")).rejects.toThrow("페이지에 접근할 수 없습니다");
  });

  it("HTTP 오류 응답 시 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    await expect(extractContent("https://example.com/404")).rejects.toThrow("페이지에 접근할 수 없습니다");
  });

  it("웹페이지 URL 추출 시 type: 'webpage'와 올바른 필드를 반환한다", async () => {
    const { Defuddle } = await import("defuddle/node");
    const { parseHTML } = await import("linkedom");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "text/html; charset=utf-8" },
      text: async () => "<html><body>Test</body></html>",
    });

    vi.mocked(parseHTML).mockReturnValueOnce({
      document: {} as Document,
    } as ReturnType<typeof parseHTML>);

    vi.mocked(Defuddle).mockResolvedValueOnce({
      title: "Test Article",
      contentMarkdown: "Test content markdown",
      author: "Test Author",
      image: "https://example.com/og.jpg",
    } as Awaited<ReturnType<typeof Defuddle>>);

    const result = await extractContent("https://example.com/article");

    expect(result.type).toBe("webpage");
    expect(result.title).toBe("Test Article");
    expect(result.content).toBe("Test content markdown");
    expect(result.source).toBe("Test Author");
    expect(result.thumbnail).toBe("https://example.com/og.jpg");
  });

  it("웹페이지에 author가 없으면 source가 도메인명이 된다", async () => {
    const { Defuddle } = await import("defuddle/node");
    const { parseHTML } = await import("linkedom");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "text/html; charset=utf-8" },
      text: async () => "<html><body>Test</body></html>",
    });

    vi.mocked(parseHTML).mockReturnValueOnce({
      document: {} as Document,
    } as ReturnType<typeof parseHTML>);

    vi.mocked(Defuddle).mockResolvedValueOnce({
      title: "Test Article",
      contentMarkdown: "Test content markdown",
      author: null,
      image: null,
    } as Awaited<ReturnType<typeof Defuddle>>);

    const result = await extractContent("https://example.com/article");

    expect(result.type).toBe("webpage");
    expect(result.source).toBe("example.com");
    expect(result.thumbnail).toBeUndefined();
  });

  it("YouTube URL 추출 시 type: 'youtube'와 Transcript 헤딩 제거된 content를 반환한다", async () => {
    const { Defuddle } = await import("defuddle/node");
    const { parseHTML } = await import("linkedom");

    // oEmbed API mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: "YouTube Video",
        author_name: "Channel Name",
        thumbnail_url: "https://img.youtube.com/vi/abc/maxresdefault.jpg",
      }),
    });

    vi.mocked(parseHTML).mockReturnValueOnce({
      document: {} as Document,
    } as ReturnType<typeof parseHTML>);

    const longTranscript = "이것은 실제 자막 텍스트입니다. 충분히 길게 작성하여 50자 이상이 되도록 합니다. 계속 씁니다.";
    vi.mocked(Defuddle).mockResolvedValueOnce({
      title: "YouTube Video",
      contentMarkdown: `## Transcript\n\n${longTranscript}`,
      author: "Channel Name",
      image: "https://img.youtube.com/vi/abc/maxresdefault.jpg",
    } as Awaited<ReturnType<typeof Defuddle>>);

    const result = await extractContent("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(result.type).toBe("youtube");
    expect(result.title).toBe("YouTube Video");
    expect(result.content).not.toContain("## Transcript");
    expect(result.source).toBe("Channel Name");
    expect(result.thumbnail).toBe("https://img.youtube.com/vi/abc/maxresdefault.jpg");
  });

  it("YouTube URL에서 자막이 없으면 '자막을 찾을 수 없습니다' 에러를 던진다", async () => {
    const { Defuddle } = await import("defuddle/node");
    const { parseHTML } = await import("linkedom");

    // oEmbed API mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: "YouTube Video",
        author_name: "Channel",
        thumbnail_url: "https://img.youtube.com/vi/abc/maxresdefault.jpg",
      }),
    });

    vi.mocked(parseHTML).mockReturnValueOnce({
      document: {} as Document,
    } as ReturnType<typeof parseHTML>);

    vi.mocked(Defuddle).mockResolvedValueOnce({
      title: "YouTube Video",
      contentMarkdown: "![thumbnail](https://img.youtube.com/vi/abc/maxresdefault.jpg)",
      author: "Channel",
      image: null,
    } as Awaited<ReturnType<typeof Defuddle>>);

    await expect(
      extractContent("https://www.youtube.com/watch?v=no-captions")
    ).rejects.toThrow("자막을 찾을 수 없습니다");
  });

  it("YouTube URL은 직접 페이지 fetch 없이 oEmbed로 메타데이터를 가져온다", async () => {
    const { Defuddle } = await import("defuddle/node");
    const { parseHTML } = await import("linkedom");

    // YouTube URL 추출에서 oEmbed fetch가 먼저 호출됨을 검증
    // oEmbed가 실패하면 빈 메타데이터로 진행, Defuddle(parseHTML 결과)로 transcript 시도
    // 자막 없음 에러는 정상적으로 발생
    mockFetch.mockResolvedValueOnce({
      ok: false, // oEmbed 실패
      status: 403,
    });

    vi.mocked(parseHTML).mockReturnValueOnce({
      document: {} as Document,
    } as ReturnType<typeof parseHTML>);

    // Defuddle은 빈 content 반환 (자막 없음)
    vi.mocked(Defuddle).mockResolvedValueOnce({
      title: "",
      contentMarkdown: "",
      author: null,
      image: null,
    } as Awaited<ReturnType<typeof Defuddle>>);

    // oEmbed가 실패해도 직접 페이지 fetch는 하지 않고 자막 없음 에러를 발생시킴
    await expect(
      extractContent("https://www.youtube.com/watch?v=test123")
    ).rejects.toThrow("자막을 찾을 수 없습니다");

    // fetch는 한 번만 호출 (oEmbed만, 직접 watch 페이지 fetch 없음)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("youtube.com/oembed"),
      expect.any(Object)
    );
  });

  it("빈 결과 시 bot UA로 재시도하여 콘텐츠를 반환한다", async () => {
    const { Defuddle } = await import("defuddle/node");
    const { parseHTML } = await import("linkedom");

    // 첫 번째 fetch: 빈 결과를 반환
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "text/html; charset=utf-8" },
        text: async () => "<html><body></body></html>",
      })
      // 두 번째 fetch: bot UA로 재시도
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "text/html; charset=utf-8" },
        text: async () => "<html><body>Actual content</body></html>",
      });

    vi.mocked(parseHTML).mockReturnValue({
      document: {} as Document,
    } as ReturnType<typeof parseHTML>);

    // 첫 번째 Defuddle 호출: 빈 결과
    vi.mocked(Defuddle)
      .mockResolvedValueOnce({
        title: "Test",
        contentMarkdown: "",
        wordCount: 0,
        author: null,
        image: null,
      } as Awaited<ReturnType<typeof Defuddle>>)
      // 두 번째 Defuddle 호출: 콘텐츠 있음
      .mockResolvedValueOnce({
        title: "Test",
        contentMarkdown: "Bot UA로 가져온 실제 콘텐츠입니다.",
        wordCount: 5,
        author: "Author",
        image: null,
      } as Awaited<ReturnType<typeof Defuddle>>);

    const result = await extractContent("https://example.com/article");

    expect(result.content).toBe("Bot UA로 가져온 실제 콘텐츠입니다.");
    // fetch가 두 번 호출되었는지 확인
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // 두 번째 호출에 bot UA가 포함되어야 한다
    const secondCall = mockFetch.mock.calls[1];
    expect(secondCall[1]).toMatchObject({
      headers: { "User-Agent": "Defuddle bot" },
    });
  });

  it("비-HTML Content-Type 응답 시 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/pdf" },
      text: async () => "PDF content",
    });

    await expect(
      extractContent("https://example.com/document.pdf")
    ).rejects.toThrow("페이지에 접근할 수 없습니다");
  });

  it("application/json Content-Type 응답 시 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => '{"data": "json"}',
    });

    await expect(
      extractContent("https://api.example.com/data")
    ).rejects.toThrow("페이지에 접근할 수 없습니다");
  });

  it("fetch timeout 시 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    // AbortError를 시뮬레이션
    const abortError = new DOMException("The operation was aborted", "AbortError");
    mockFetch.mockRejectedValueOnce(abortError);

    await expect(
      extractContent("https://slow-site.example.com")
    ).rejects.toThrow("페이지에 접근할 수 없습니다");
  });
});

describe("getInitialUA", () => {
  it("github.com은 bot UA를 반환한다", () => {
    expect(getInitialUA("https://github.com/owner/repo")).toBe("Defuddle bot");
  });

  it("raw.githubusercontent.com은 bot UA를 반환한다", () => {
    expect(getInitialUA("https://raw.githubusercontent.com/owner/repo/main/file.md")).toBe("Defuddle bot");
  });

  it("일반 도메인은 빈 문자열을 반환한다", () => {
    expect(getInitialUA("https://example.com/article")).toBe("");
  });

  it("잘못된 URL은 빈 문자열을 반환한다", () => {
    expect(getInitialUA("not-a-url")).toBe("");
  });
});
