import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FeedmePage from "@/components/feedme-page";

describe("feedme spec tests", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // FEEDME-001
  describe("FEEDME-001: 웹페이지 URL 추출", () => {
    it("웹페이지 URL 입력 후 가져오기 버튼 클릭 시 제목과 본문이 렌더링된 마크다운 미리보기로 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          markdown: "# 웹 접근성 가이드라인 소개\n\n웹 접근성은 장애 여부와 관계없이 모든 사람이 웹 콘텐츠를 이용할 수 있도록 보장합니다.",
        }),
      } as Response);

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/웹 접근성 가이드라인 소개/)).toBeInTheDocument();
      });

      expect(screen.getByText(/웹 접근성은 장애 여부와 관계없이/)).toBeInTheDocument();
    });
  });

  // FEEDME-002
  describe("FEEDME-002: YouTube URL 추출", () => {
    it("YouTube URL 입력 후 가져오기 버튼 클릭 시 제목, 채널명, 자막이 렌더링된 마크다운으로 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          markdown: "# Never Gonna Give You Up\n\n채널: Rick Astley\n\n## 자막\n\nWe're no strangers to love",
        }),
      } as Response);

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Never Gonna Give You Up/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Rick Astley/)).toBeInTheDocument();
      expect(screen.getByText(/We're no strangers to love/)).toBeInTheDocument();
    });
  });

  // FEEDME-003
  describe("FEEDME-003: 로딩 인디케이터", () => {
    it("가져오기 버튼 클릭 직후 로딩 인디케이터가 표시된다", async () => {
      const user = userEvent.setup();
      let resolveResponse: (value: unknown) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
      );

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      expect(screen.getByRole("status")).toBeInTheDocument();

      resolveResponse!({
        ok: true,
        json: async () => ({ markdown: "# 제목\n\n본문" }),
      });
    });
  });

  // FEEDME-004
  describe("FEEDME-004: 초기 화면 복사 버튼 미표시", () => {
    it("초기 화면에서 복사 버튼이 표시되지 않는다", () => {
      render(<FeedmePage />);

      expect(screen.queryByRole("button", { name: /복사/ })).not.toBeInTheDocument();
    });
  });

  // FEEDME-005
  describe("FEEDME-005: 클립보드 복사 및 토스트", () => {
    it("추출 완료 후 복사 버튼 클릭 시 클립보드에 복사되고 복사됨 토스트가 표시된다", async () => {
      const user = userEvent.setup({ writeToClipboard: false });
      const markdownContent = "# 제목\n\n본문 내용";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ markdown: markdownContent }),
      } as Response);

      // userEvent.setup() 이후 clipboard mock 재설정 (userEvent가 clipboard를 교체하므로)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /복사/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /복사/ }));

      expect(writeTextMock).toHaveBeenCalledWith(markdownContent);

      await waitFor(() => {
        expect(screen.getByText("복사됨")).toBeInTheDocument();
      });
    });
  });

  // FEEDME-006
  describe("FEEDME-006: 빈 URL 에러", () => {
    it("빈 URL로 가져오기 버튼 클릭 시 올바른 URL을 입력해주세요 에러가 표시된다", async () => {
      const user = userEvent.setup();

      render(<FeedmePage />);

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      expect(screen.getByText("올바른 URL을 입력해주세요")).toBeInTheDocument();
    });
  });

  // FEEDME-007
  describe("FEEDME-007: 잘못된 URL 에러", () => {
    it("not-a-url 입력 후 가져오기 클릭 시 올바른 URL을 입력해주세요 에러가 표시된다", async () => {
      const user = userEvent.setup();

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      expect(screen.getByText("올바른 URL을 입력해주세요")).toBeInTheDocument();
    });
  });

  // FEEDME-008
  describe("FEEDME-008: 접근 불가 URL 에러", () => {
    it("접근 불가 URL 입력 후 가져오기 클릭 시 페이지에 접근할 수 없습니다 에러가 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "페이지에 접근할 수 없습니다" }),
      } as Response);

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://unreachable.invalid");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("페이지에 접근할 수 없습니다")).toBeInTheDocument();
      });
    });
  });

  // FEEDME-009
  describe("FEEDME-009: 자막 없는 YouTube URL 에러", () => {
    it("자막 없는 YouTube URL 입력 후 가져오기 클릭 시 자막을 찾을 수 없습니다 에러가 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "자막을 찾을 수 없습니다" }),
      } as Response);

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://www.youtube.com/watch?v=no-captions");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("자막을 찾을 수 없습니다")).toBeInTheDocument();
      });
    });
  });
});
