import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UrlInputSection } from "@/components/url-input-section";
import ContentExtractor from "@/components/content-extractor";

describe("fix-ui spec tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // FEEDME-050
  describe("FEEDME-050: clear 버튼 표시/숨김 조건", () => {
    it("URL 입력창에 텍스트가 있으면 clear 버튼이 표시된다", () => {
      render(
        <UrlInputSection
          url="https://example.com"
          loading={false}
          error={null}
          onUrlChange={vi.fn()}
          onErrorClear={vi.fn()}
          onFetch={vi.fn()}
        />
      );

      const clearButton = screen.getByRole("button", { name: "입력 지우기" });
      expect(clearButton).toBeInTheDocument();
    });

    it("URL 입력창이 비어있으면 clear 버튼이 표시되지 않는다", () => {
      render(
        <UrlInputSection
          url=""
          loading={false}
          error={null}
          onUrlChange={vi.fn()}
          onErrorClear={vi.fn()}
          onFetch={vi.fn()}
        />
      );

      const clearButton = screen.queryByRole("button", { name: "입력 지우기" });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  // FEEDME-051
  describe("FEEDME-051: clear 버튼 클릭 시 URL만 비워지고 프리뷰는 유지된다", () => {
    it("clear 버튼 클릭 후 URL이 비워지고 이미 불러온 결과(프리뷰)는 유지된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          markdown: "# 테스트 콘텐츠",
          title: "테스트 제목",
          type: "webpage",
        }),
      } as Response);

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole("button", { name: "입력 지우기" });
      await user.click(clearButton);

      expect(input).toHaveValue("");
      expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
    });
  });

  // FEEDME-052
  describe("FEEDME-052: loading 중에는 clear 버튼이 표시되지 않는다", () => {
    it("fetch 진행 중(loading=true)에는 clear 버튼이 표시되지 않는다", () => {
      render(
        <UrlInputSection
          url="https://example.com"
          loading={true}
          error={null}
          onUrlChange={vi.fn()}
          onErrorClear={vi.fn()}
          onFetch={vi.fn()}
        />
      );

      const clearButton = screen.queryByRole("button", { name: "입력 지우기" });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  // FEEDME-053
  describe("FEEDME-053: 에러 상태에서 clear 버튼 클릭 시 URL과 에러 메시지 모두 사라진다", () => {
    it("clear 버튼 클릭 시 URL 입력창이 비워지고 에러 메시지도 사라진다", async () => {
      const user = userEvent.setup();
      const mockOnUrlChange = vi.fn();
      const mockOnErrorClear = vi.fn();

      const { rerender } = render(
        <UrlInputSection
          url="https://bad-url.com"
          loading={false}
          error="잘못된 URL입니다"
          onUrlChange={mockOnUrlChange}
          onErrorClear={mockOnErrorClear}
          onFetch={vi.fn()}
        />
      );

      expect(screen.getByText("잘못된 URL입니다")).toBeInTheDocument();

      const clearButton = screen.getByRole("button", { name: "입력 지우기" });
      await user.click(clearButton);

      expect(mockOnUrlChange).toHaveBeenCalledWith("");
      expect(mockOnErrorClear).toHaveBeenCalled();

      rerender(
        <UrlInputSection
          url=""
          loading={false}
          error={null}
          onUrlChange={mockOnUrlChange}
          onErrorClear={mockOnErrorClear}
          onFetch={vi.fn()}
        />
      );

      // 에러 메시지가 사라진다
      expect(screen.queryByText("잘못된 URL입니다")).not.toBeInTheDocument();
    });
  });
});
