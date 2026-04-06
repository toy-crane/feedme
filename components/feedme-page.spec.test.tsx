import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FeedmePage from "@/components/feedme-page";

describe("feedme-page spec acceptance tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // FEEDME-006: When URL input is empty → '가져오기' button is disabled
  describe("FEEDME-006: 빈 URL 입력 시 버튼 비활성화", () => {
    it("URL 입력이 비어 있을 때 '가져오기' 버튼이 비활성화된다", () => {
      render(<FeedmePage />);

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-007: When URL input has invalid text ("not-a-url") → '가져오기' button is disabled
  describe("FEEDME-007: 잘못된 URL 입력 시 버튼 비활성화", () => {
    it("not-a-url 입력 시 '가져오기' 버튼이 비활성화된다", async () => {
      const user = userEvent.setup();
      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-012: When invalid URL changes to valid → button becomes enabled
  describe("FEEDME-012: 유효하지 않은 URL이 유효한 URL로 변경되면 버튼 활성화", () => {
    it("not-a-url 입력 후 https://example.com으로 변경하면 '가져오기' 버튼이 활성화된다", async () => {
      const user = userEvent.setup();
      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");

      await user.clear(input);
      await user.type(input, "https://example.com");

      expect(button).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-003: During loading → button shows spinner, "가져오기" text is NOT visible,
  //             separate loading area ("불러오는 중...") does NOT exist
  describe("FEEDME-003: 로딩 중 버튼 스피너 표시", () => {
    it("로딩 중 버튼 내부에 스피너가 표시되고 '가져오기' 텍스트는 보이지 않는다", async () => {
      const user = userEvent.setup();
      let resolveResponse: (value: unknown) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
      );

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      // Button should contain a spinner (role="status" or SVG with animate-spin)
      const spinner =
        button.querySelector('[role="status"]') ??
        button.querySelector("svg.animate-spin") ??
        button.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();

      // "가져오기" text should NOT be visible in the button
      expect(button).not.toHaveTextContent("가져오기");

      // Separate loading area with "불러오는 중..." should NOT exist
      expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();

      resolveResponse!({
        ok: true,
        json: async () => ({ markdown: "# 제목" }),
      });
    });
  });

  // FEEDME-008: After server returns unreachable error → inline error text below input, NO Alert
  describe("FEEDME-008: 접근 불가 URL 에러 - 인라인 표시", () => {
    it("서버가 접근 불가 오류를 반환하면 인풋 하단에 인라인 에러 텍스트가 표시되고 Alert 컴포넌트는 사용되지 않는다", async () => {
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

      // Error text should be inline below input, NOT inside an Alert component
      const errorText = screen.getByText("페이지에 접근할 수 없습니다");
      expect(errorText.closest('[role="alert"]')).toBeNull();
    });
  });

  // FEEDME-009: After server returns no-captions error → inline error text below input, NO Alert
  describe("FEEDME-009: 자막 없음 에러 - 인라인 표시", () => {
    it("서버가 자막 없음 오류를 반환하면 인풋 하단에 인라인 에러 텍스트가 표시되고 Alert 컴포넌트는 사용되지 않는다", async () => {
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

      // Error text should be inline below input, NOT inside an Alert component
      const errorText = screen.getByText("자막을 찾을 수 없습니다");
      expect(errorText.closest('[role="alert"]')).toBeNull();
    });
  });

  // FEEDME-011: After network error → inline error text below input, NO Alert
  describe("FEEDME-011: 네트워크 오류 - 인라인 표시", () => {
    it("네트워크 오류 발생 시 인풋 하단에 인라인 에러 텍스트가 표시되고 Alert 컴포넌트는 사용되지 않는다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("네트워크 오류가 발생했습니다")).toBeInTheDocument();
      });

      // Error text should be inline below input, NOT inside an Alert component
      const errorText = screen.getByText("네트워크 오류가 발생했습니다");
      expect(errorText.closest('[role="alert"]')).toBeNull();
    });
  });

  // FEEDME-010: When error is shown and user types in input → error text disappears
  describe("FEEDME-010: 에러 표시 후 입력 시 에러 사라짐", () => {
    it("에러가 표시된 상태에서 입력 필드에 타이핑하면 에러 텍스트가 사라진다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<FeedmePage />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("네트워크 오류가 발생했습니다")).toBeInTheDocument();
      });

      // When user types in input, error should disappear
      await user.type(input, "a");

      expect(screen.queryByText("네트워크 오류가 발생했습니다")).not.toBeInTheDocument();
    });
  });
});

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
      render(<FeedmePage />);

      expect(screen.getByText("Feed-me")).toBeInTheDocument();
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });
  });

  // LOGO-002: 로고 위에 마우스를 올리면, 포인터 커서가 표시된다
  describe("LOGO-002: 로고 호버 시 포인터 커서", () => {
    it("로고 요소에 cursor-pointer 스타일이 적용되어 있다", () => {
      render(<FeedmePage />);

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

      render(<FeedmePage />);

      // URL 입력 후 가져오기
      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      // 결과가 표시될 때까지 대기
      await waitFor(() => {
        expect(screen.getByText("복사")).toBeInTheDocument();
      });

      // 로고 클릭
      const logo = screen.getByTestId("logo");
      await user.click(logo);

      // URL 입력값이 비워져야 한다
      expect(input).toHaveValue("");

      // 미리보기(결과)가 사라져야 한다
      expect(screen.queryByText("# 추출된 콘텐츠")).not.toBeInTheDocument();

      // 복사 버튼이 사라져야 한다
      expect(screen.queryByText("복사")).not.toBeInTheDocument();

      // 에러도 없어야 한다
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // LOGO-004: 에러 메시지가 표시된 상태에서 로고 클릭 시, 에러 사라지고 초기화
  describe("LOGO-004: 에러 상태에서 로고 클릭 시 초기화", () => {
    it("에러가 표시된 상태에서 로고 클릭 시 에러가 사라지고 초기화된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<FeedmePage />);

      // URL 입력 후 가져오기 → 에러 상태 만들기
      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("네트워크 오류가 발생했습니다")).toBeInTheDocument();
      });

      // 로고 클릭
      const logo = screen.getByTestId("logo");
      await user.click(logo);

      // 에러가 사라져야 한다
      expect(screen.queryByText("네트워크 오류가 발생했습니다")).not.toBeInTheDocument();

      // URL 입력값이 비워져야 한다
      expect(input).toHaveValue("");

      // 미리보기도 없어야 한다
      expect(screen.queryByText("복사")).not.toBeInTheDocument();
    });
  });
});
