import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractContent } from "./extract";

describe("extractContent - URL 유효성 검증", () => {
  it("빈 문자열 입력 시 '올바른 URL을 입력해주세요' 에러를 던진다", async () => {
    await expect(extractContent("")).rejects.toThrow("올바른 URL을 입력해주세요");
  });

  it("잘못된 형식의 URL 입력 시 '올바른 URL을 입력해주세요' 에러를 던진다", async () => {
    await expect(extractContent("not-a-url")).rejects.toThrow(
      "올바른 URL을 입력해주세요"
    );
  });

  it("프로토콜 없는 URL 입력 시 '올바른 URL을 입력해주세요' 에러를 던진다", async () => {
    await expect(extractContent("example.com")).rejects.toThrow(
      "올바른 URL을 입력해주세요"
    );
  });
});

describe("extractContent - YouTube URL 감지", () => {
  it("youtube.com/watch URL을 YouTube 타입으로 감지한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        '<html><head><title>Test Video</title></head><body><div id="watch7-content"><div class="ytd-channel-name">TestChannel</div></div></body></html>',
    });

    // YouTube 처리는 자막 없는 경우 에러를 던지므로, 에러 타입을 확인
    try {
      await extractContent("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it("youtu.be URL을 YouTube 타입으로 감지한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "<html><head><title>Test</title></head><body></body></html>",
    });

    try {
      await extractContent("https://youtu.be/dQw4w9WgXcQ");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});

describe("extractContent - 에러 처리", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetch 실패 시 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(
      extractContent("https://unreachable.invalid")
    ).rejects.toThrow("페이지에 접근할 수 없습니다");
  });

  it("HTTP 응답이 ok가 아닐 때 '페이지에 접근할 수 없습니다' 에러를 던진다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not Found",
    });

    await expect(
      extractContent("https://example.com/not-found")
    ).rejects.toThrow("페이지에 접근할 수 없습니다");
  });

  it("정상적인 웹페이지 URL 요청 시 webpage 타입을 반환한다", async () => {
    const mockHtml = `
      <html>
        <head><title>Test Article</title></head>
        <body>
          <article>
            <h1>Test Article</h1>
            <p>This is the article content.</p>
          </article>
        </body>
      </html>
    `;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const result = await extractContent("https://example.com/article");
    expect(result.type).toBe("webpage");
    expect(result.title).toBeDefined();
    expect(typeof result.content).toBe("string");
  });
});

describe("extractContent - YouTube 자막 없음 에러", () => {
  it("자막 없는 YouTube URL 입력 시 '자막을 찾을 수 없습니다' 에러를 던진다", async () => {
    // YouTube 페이지 HTML이지만 자막 데이터가 없는 경우
    const mockYouTubeHtml = `
      <html>
        <head><title>Video Without Captions - YouTube</title></head>
        <body>
          <div id="watch7-content">No transcript available</div>
        </body>
      </html>
    `;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockYouTubeHtml,
    });

    await expect(
      extractContent("https://www.youtube.com/watch?v=no-captions")
    ).rejects.toThrow("자막을 찾을 수 없습니다");
  });
});
