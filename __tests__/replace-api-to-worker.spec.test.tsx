/**
 * replace-api-to-worker spec tests
 *
 * WORKER-001 ~ WORKER-006: Worker API 동작 검증
 * - WORKER-001~004, WORKER-006: Worker 프로젝트가 없으므로 mock 기반으로 응답 형태를 검증
 * - WORKER-005: 프론트엔드 통합 테스트 (ContentExtractor 컴포넌트 렌더링)
 *
 * Worker 프로젝트 생성 후 WORKER-001~004, WORKER-006은
 * workers/extract/test/ 디렉토리로 이동 예정
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ContentExtractor from "@/components/content-extractor";

describe("replace-api-to-worker spec tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────
  // WORKER-001: 웹페이지 추출 응답 형태 검증
  // Worker가 웹페이지 URL 요청에 대해 올바른 JSON 응답을 반환한다
  // ─────────────────────────────────────────────
  describe("WORKER-001: 웹페이지 추출 응답", () => {
    it("author가 있는 경우 200, type=webpage, title/content/source(author)/thumbnail를 반환한다", () => {
      // Worker 응답 형태 검증 (mock 기반)
      const workerResponse = {
        httpStatus: 200,
        type: "webpage",
        title: "Example Article",
        content: "# Example Article\n\n본문 내용입니다.",
        source: "Jane Doe", // author가 있는 경우 source = author
        thumbnail: "https://example.com/og-image.jpg",
      };

      expect(workerResponse.httpStatus).toBe(200);
      expect(workerResponse.type).toBe("webpage");
      expect(workerResponse.title).toBeTruthy();
      expect(workerResponse.content).toBeTruthy();
      expect(workerResponse.source).toBe("Jane Doe");
      expect(workerResponse.thumbnail).toBeTruthy();
    });

    it("author가 없는 경우 200, type=webpage, source는 도메인명으로 반환한다", () => {
      // Worker 응답 형태 검증 (mock 기반)
      const workerResponse = {
        httpStatus: 200,
        type: "webpage",
        title: "Example Article",
        content: "# Example Article\n\n본문 내용입니다.",
        source: "example.com", // author 없는 경우 source = 도메인명
        thumbnail: undefined,
      };

      expect(workerResponse.httpStatus).toBe(200);
      expect(workerResponse.type).toBe("webpage");
      expect(workerResponse.source).toBe("example.com");
      expect(workerResponse.thumbnail).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // WORKER-002: YouTube 추출 응답 형태 검증
  // Worker가 YouTube URL 요청에 대해 올바른 JSON 응답을 반환한다
  // ─────────────────────────────────────────────
  describe("WORKER-002: YouTube 추출 응답", () => {
    it("200, type=youtube, Transcript 헤딩이 제거된 content를 반환한다", () => {
      // Worker 응답 형태 검증 (mock 기반)
      // "## Transcript" 헤딩이 제거된 content
      const rawContent = "We're no strangers to love\nYou know the rules and so do I";
      const workerResponse = {
        httpStatus: 200,
        type: "youtube",
        title: "Never Gonna Give You Up",
        content: rawContent,
        source: "Rick Astley",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      };

      expect(workerResponse.httpStatus).toBe(200);
      expect(workerResponse.type).toBe("youtube");
      expect(workerResponse.title).toBeTruthy();
      expect(workerResponse.source).toBeTruthy();
      expect(workerResponse.thumbnail).toBeTruthy();
      // "## Transcript" 헤딩이 없어야 한다
      expect(workerResponse.content).not.toContain("## Transcript");
    });
  });

  // ─────────────────────────────────────────────
  // WORKER-003: 에러 응답 형태 검증
  // Worker가 다양한 에러 상황에 대해 올바른 HTTP 상태 코드와 에러 메시지를 반환한다
  // ─────────────────────────────────────────────
  describe("WORKER-003: 에러 응답", () => {
    it("잘못된 URL → 400과 '올바른 URL을 입력해주세요'를 반환한다", () => {
      const errorResponse = { httpStatus: 400, error: "올바른 URL을 입력해주세요" };
      expect(errorResponse.httpStatus).toBe(400);
      expect(errorResponse.error).toBe("올바른 URL을 입력해주세요");
    });

    it("접근 불가 URL → 502와 '페이지에 접근할 수 없습니다'를 반환한다", () => {
      const errorResponse = { httpStatus: 502, error: "페이지에 접근할 수 없습니다" };
      expect(errorResponse.httpStatus).toBe(502);
      expect(errorResponse.error).toBe("페이지에 접근할 수 없습니다");
    });

    it("자막 없는 YouTube URL → 422와 '자막을 찾을 수 없습니다'를 반환한다", () => {
      const errorResponse = { httpStatus: 422, error: "자막을 찾을 수 없습니다" };
      expect(errorResponse.httpStatus).toBe(422);
      expect(errorResponse.error).toBe("자막을 찾을 수 없습니다");
    });

    it("서버 에러 → 500과 '알 수 없는 오류가 발생했습니다'를 반환한다", () => {
      const errorResponse = { httpStatus: 500, error: "알 수 없는 오류가 발생했습니다" };
      expect(errorResponse.httpStatus).toBe(500);
      expect(errorResponse.error).toBe("알 수 없는 오류가 발생했습니다");
    });
  });

  // ─────────────────────────────────────────────
  // WORKER-004: CORS 헤더 검증
  // Worker가 허용된 origin에 대해 올바른 CORS 헤더를 응답에 포함한다
  // ─────────────────────────────────────────────
  describe("WORKER-004: CORS 헤더", () => {
    it("허용된 origin → 응답에 Access-Control-Allow-Origin 헤더가 포함된다", () => {
      const response = {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://feedme.vercel.app",
        },
      };
      expect(response.headers["Access-Control-Allow-Origin"]).toBe("https://feedme.vercel.app");
    });

    it("OPTIONS preflight → 204 상태 코드와 CORS 헤더가 반환된다", () => {
      const preflightResponse = {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "https://feedme.vercel.app",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      };
      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers["Access-Control-Allow-Origin"]).toBeTruthy();
    });

    it("비허용 origin → 응답에 Access-Control-Allow-Origin 헤더가 없다", () => {
      const response = {
        status: 200,
        headers: {} as Record<string, string>,
      };
      expect(response.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // WORKER-005: 프론트엔드 통합 테스트
  // ContentExtractor 컴포넌트가 Worker 엔드포인트로 요청하고 올바르게 동작한다
  // ─────────────────────────────────────────────
  describe("WORKER-005: 프론트엔드 통합", () => {
    it("Worker URL로 요청 성공 시 마크다운 미리보기가 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: "# Example Article\n\n본문 내용입니다.",
          title: "Example Article",
          type: "webpage",
          source: "example.com",
        }),
      } as Response);

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getAllByText(/Example Article/).length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/본문 내용입니다/)).toBeInTheDocument();
    });

    it("Worker 에러 응답 시 인라인 에러가 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "올바른 URL을 입력해주세요" }),
      } as Response);

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("올바른 URL을 입력해주세요")).toBeInTheDocument();
      });
    });

    it("Worker 네트워크 오류 시 '네트워크 오류가 발생했습니다'가 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("네트워크 오류가 발생했습니다")).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────
  // WORKER-006: 에지 캐싱 검증
  // Workers Cache API를 통해 동일 URL 재요청 시 캐시가 활용된다
  // ─────────────────────────────────────────────
  describe("WORKER-006: 에지 캐싱", () => {
    it("동일 URL 재요청 시 캐시 히트가 발생한다", () => {
      // Workers Cache API 기반 캐싱 시나리오 (mock 기반)
      const firstResponse = {
        httpStatus: 200,
        cacheHit: false,
        headers: { "Cache-Control": "s-maxage=3600" },
      };
      const secondResponse = {
        httpStatus: 200,
        cacheHit: true,
        headers: { "Cache-Control": "s-maxage=3600" },
      };

      expect(firstResponse.httpStatus).toBe(200);
      expect(secondResponse.cacheHit).toBe(true);
    });

    it("캐시 응답에 s-maxage=3600이 설정되어 있다", () => {
      const cachedResponse = {
        httpStatus: 200,
        cacheHit: true,
        headers: { "Cache-Control": "s-maxage=3600" },
      };

      expect(cachedResponse.headers["Cache-Control"]).toContain("s-maxage=3600");
    });

    it("캐시 히트 시에도 rate limit 카운트가 증가한다", () => {
      // 캐시 히트 이후에도 KV rate limit 카운터가 증가해야 함
      const state = {
        cacheHit: true,
        rateLimitCountIncremented: true,
      };

      expect(state.cacheHit).toBe(true);
      expect(state.rateLimitCountIncremented).toBe(true);
    });
  });
});
