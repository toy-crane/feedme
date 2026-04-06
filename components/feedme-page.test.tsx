import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FeedmePage from "@/components/feedme-page";

describe("feedme-page unit tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe("버튼 비활성화 상태 (isValidUrl 기반)", () => {
    it("URL이 빈 문자열일 때 가져오기 버튼이 비활성화된다", () => {
      render(<FeedmePage />);

      const button = screen.getByRole("button", { name: "가져오기" });

      // URL input은 비어있는 초기 상태
      expect(button).toBeDisabled();
    });

    it("URL이 유효하지 않은 값(not-a-url)일 때 가져오기 버튼이 비활성화된다", async () => {
      const user = userEvent.setup();
      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toBeDisabled();
    });

    it("URL이 유효한 값(https://example.com)일 때 가져오기 버튼이 활성화된다", async () => {
      const user = userEvent.setup();
      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).not.toBeDisabled();
    });
  });

  describe("onChange 핸들러가 에러 상태를 초기화한다", () => {
    it("에러가 표시된 상태에서 URL 입력 시 에러가 사라진다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      render(<FeedmePage />);

      // 유효한 URL로 가져오기 클릭 → 네트워크 에러 표시
      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await screen.findByText("네트워크 오류가 발생했습니다");

      // URL 입력 시 에러가 사라져야 한다
      await user.type(input, "a");

      expect(screen.queryByText("네트워크 오류가 발생했습니다")).not.toBeInTheDocument();
    });
  });
});
