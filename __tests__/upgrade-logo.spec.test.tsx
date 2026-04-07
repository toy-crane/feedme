import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ContentExtractor from "@/components/content-extractor";

describe("upgrade-logo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // LOGO-001: feedme 페이지 접속 시, HyperText 컴포넌트로 "Feed-me" 텍스트가 표시된다
  describe("LOGO-001: HyperText 컴포넌트로 'Feed-me' 텍스트 표시", () => {
    it("페이지에 'Feed-me' 텍스트가 표시되고 HyperText 컴포넌트가 사용된다", () => {
      render(<ContentExtractor />);

      expect(screen.getByText("Feed-me")).toBeInTheDocument();
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });
  });

  // LOGO-002: 로고 위에 마우스를 올리면, 포인터 커서가 표시된다
  describe("LOGO-002: 로고 호버 시 포인터 커서", () => {
    it("로고 요소에 cursor-pointer 스타일이 적용되어 있다", () => {
      render(<ContentExtractor />);

      const logoContainer = screen.getByTestId("logo");
      expect(logoContainer.classList.contains("cursor-pointer")).toBe(true);
    });
  });

  // LOGO-003: URL 입력 후 콘텐츠가 추출된 상태에서 로고 클릭 시, 초기화
  describe("LOGO-003: 콘텐츠 추출 후 로고 클릭 시 초기화", () => {
    it("결과가 표시된 상태에서 로고 클릭 시 URL 입력값이 비워지고 미리보기와 복사 버튼이 사라진다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          markdown: "# 추출된 콘텐츠",
          title: "테스트 페이지",
        }),
      } as Response);

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("복사하기")).toBeInTheDocument();
      });

      const logo = screen.getByTestId("logo");
      await user.click(logo);

      expect(input).toHaveValue("");
      expect(screen.queryByText("# 추출된 콘텐츠")).not.toBeInTheDocument();
      expect(screen.queryByText("복사하기")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // LOGO-004: 에러 메시지가 표시된 상태에서 로고 클릭 시, 에러 사라지고 초기화
  describe("LOGO-004: 에러 상태에서 로고 클릭 시 초기화", () => {
    it("에러가 표시된 상태에서 로고 클릭 시 에러가 사라지고 초기화된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("네트워크 오류가 발생했습니다")).toBeInTheDocument();
      });

      const logo = screen.getByTestId("logo");
      await user.click(logo);

      expect(screen.queryByText("네트워크 오류가 발생했습니다")).not.toBeInTheDocument();
      expect(input).toHaveValue("");
      expect(screen.queryByText("복사하기")).not.toBeInTheDocument();
    });
  });
});
