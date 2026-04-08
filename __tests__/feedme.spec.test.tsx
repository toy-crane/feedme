import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ContentExtractor from "@/components/content-extractor";
import { renderWithContent } from "@/__tests__/helpers";

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
        json: async () => ({ title: "웹 접근성 가이드라인 소개", content: "# 웹 접근성 가이드라인 소개\n\n웹 접근성은 장애 여부와 관계없이 모든 사람이 웹 콘텐츠를 이용할 수 있도록 보장합니다." }),
      } as Response);

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getAllByText(/웹 접근성 가이드라인 소개/).length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/웹 접근성은 장애 여부와 관계없이/)).toBeInTheDocument();
    });
  });

  // FEEDME-003
  describe("FEEDME-003: 로딩 스피너", () => {
    it("가져오기 버튼 클릭 직후 버튼에 스피너가 표시되고 텍스트는 사라진다", async () => {
      const user = userEvent.setup();
      let resolveResponse: (value: unknown) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveResponse = resolve;
        })
      );

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      // 버튼에 스피너(animate-spin)가 표시되고 텍스트가 사라짐
      const buttons = screen.getAllByRole("button");
      const fetchButton = buttons.find(
        (b) => b.querySelector(".animate-spin") || b.textContent === "가져오기"
      )!;
      expect(fetchButton.querySelector(".animate-spin")).toBeInTheDocument();
      expect(fetchButton.textContent).not.toContain("가져오기");

      // 별도 로딩 영역이 없음
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      resolveResponse!({
        ok: true,
        json: async () => ({ title: "제목", content: "# 제목\n\n본문" }),
      });
    });
  });

  // FEEDME-045 (replaces FEEDME-004)
  describe("FEEDME-045: 초기 화면 split button 미표시", () => {
    it("초기 화면에서 복사 버튼이 표시되지 않는다", () => {
      render(<ContentExtractor />);

      expect(screen.queryByRole("button", { name: /복사/ })).not.toBeInTheDocument();
    });
  });

  // FEEDME-041 (replaces FEEDME-005)
  describe("FEEDME-041: 클립보드 복사 및 체크 아이콘", () => {
    it("추출 완료 후 복사 버튼 클릭 시 클립보드에 복사되고 버튼에 체크 아이콘이 표시된다", async () => {
      const user = userEvent.setup({ writeToClipboard: false });
      const markdownContent = "# 제목\n\n본문 내용";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ title: "제목", content: markdownContent }),
      } as Response);

      // userEvent.setup() 이후 clipboard mock 재설정 (userEvent가 clipboard를 교체하므로)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");

      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /복사/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /복사/ }));

      expect(writeTextMock).toHaveBeenCalledWith(markdownContent);

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /복사/ });
        expect(copyButton).toHaveAttribute("data-copied", "true");
      });
    });
  });

  // FEEDME-006
  describe("FEEDME-006: 빈 URL 시 버튼 비활성화", () => {
    it("빈 URL일 때 가져오기 버튼이 disabled 상태이다", () => {
      render(<ContentExtractor />);

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-007
  describe("FEEDME-007: 잘못된 URL 시 버튼 비활성화", () => {
    it("not-a-url 입력 시 가져오기 버튼이 disabled 상태이다", async () => {
      const user = userEvent.setup();

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-008
  describe("FEEDME-008: 접근 불가 URL 에러", () => {
    it("접근 불가 URL 입력 후 가져오기 클릭 시 페이지에 접근할 수 없습니다 에러가 표시된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: "페이지에 접근할 수 없습니다" }),
      } as Response);

      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://unreachable.invalid");

      const button = screen.getByRole("button", { name: "가져오기" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("페이지에 접근할 수 없습니다")).toBeInTheDocument();
      });
    });
  });

  // FEEDME-010: When error is shown and user types in input → error text disappears
  describe("FEEDME-010: 에러 표시 후 입력 시 에러 사라짐", () => {
    it("에러가 표시된 상태에서 입력 필드에 타이핑하면 에러 텍스트가 사라진다", async () => {
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

      await user.type(input, "a");

      expect(screen.queryByText("네트워크 오류가 발생했습니다")).not.toBeInTheDocument();
    });
  });

  // FEEDME-011: After network error → inline error text below input, NO Alert
  describe("FEEDME-011: 네트워크 오류 - 인라인 표시", () => {
    it("네트워크 오류 발생 시 인풋 하단에 인라인 에러 텍스트가 표시되고 Alert 컴포넌트는 사용되지 않는다", async () => {
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

      const errorText = screen.getByText("네트워크 오류가 발생했습니다");
      expect(errorText.closest('[role="alert"]')).toBeNull();
    });
  });

  // FEEDME-012: When invalid URL changes to valid → button becomes enabled
  describe("FEEDME-012: 유효하지 않은 URL이 유효한 URL로 변경되면 버튼 활성화", () => {
    it("not-a-url 입력 후 https://example.com으로 변경하면 '가져오기' 버튼이 활성화된다", async () => {
      const user = userEvent.setup();
      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");

      await user.clear(input);
      await user.type(input, "https://example.com");

      expect(button).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-030: 콘텐츠 추출 후 split button 표시
  describe("FEEDME-030: 콘텐츠 추출 후 split button 표시", () => {
    it("복사 아이콘+텍스트 메인 버튼과 chevron 버튼이 함께 표시된다", async () => {
      await renderWithContent();

      const copyButton = screen.getByRole("button", { name: "복사하기" });
      expect(copyButton).toBeInTheDocument();

      const iconInCopyButton = copyButton.querySelector("svg");
      expect(iconInCopyButton).not.toBeNull();

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      expect(chevronButton).toBeInTheDocument();
    });
  });

  // FEEDME-031: 메인 복사 버튼 클릭 → 클립보드 복사 + 체크 아이콘 (토스트 없음)
  describe("FEEDME-031: 메인 복사 버튼 클릭 시 클립보드 복사 및 체크 아이콘 표시", () => {
    it("클립보드에 마크다운이 복사되고 버튼 아이콘이 체크로 바뀐다", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      const { user } = await renderWithContent("# Hello");

      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const copyButton = screen.getByRole("button", { name: "복사하기" });
      await user.click(copyButton);

      expect(writeText).toHaveBeenCalledWith("# Hello");

      await waitFor(() => {
        const updatedButton = screen.getByRole("button", { name: "복사하기" });
        expect(updatedButton).toHaveAttribute("data-copied", "true");
      });

      expect(screen.queryByText("복사됨")).not.toBeInTheDocument();
    });
  });

  // FEEDME-032: chevron 버튼 클릭 → 드롭다운 메뉴에 3개 항목 표시
  describe("FEEDME-032: chevron 버튼 클릭 시 드롭다운 메뉴 표시", () => {
    it("마크다운 다운로드, ChatGPT에서 열기, Claude에서 열기 항목이 아이콘과 함께 표시된다", async () => {
      const { user } = await renderWithContent();

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("마크다운 다운로드")).toBeInTheDocument();
        expect(screen.getByText("ChatGPT에서 열기")).toBeInTheDocument();
        expect(screen.getByText("Claude에서 열기")).toBeInTheDocument();
      });

      const downloadItem = screen.getByText("마크다운 다운로드");
      const chatgptItem = screen.getByText("ChatGPT에서 열기");
      const claudeItem = screen.getByText("Claude에서 열기");

      const downloadMenuItem = downloadItem.closest('[role="menuitem"]') ?? downloadItem.parentElement;
      const chatgptMenuItem = chatgptItem.closest('[role="menuitem"]') ?? chatgptItem.parentElement;
      const claudeMenuItem = claudeItem.closest('[role="menuitem"]') ?? claudeItem.parentElement;

      const downloadIcon =
        downloadMenuItem!.querySelector("svg") ?? downloadMenuItem!.querySelector("img");
      const chatgptIcon =
        chatgptMenuItem!.querySelector("svg") ?? chatgptMenuItem!.querySelector("img");
      const claudeIcon =
        claudeMenuItem!.querySelector("svg") ?? claudeMenuItem!.querySelector("img");
      expect(downloadIcon).not.toBeNull();
      expect(chatgptIcon).not.toBeNull();
      expect(claudeIcon).not.toBeNull();
    });
  });

  // FEEDME-033: ChatGPT에서 열기 → 마크다운 포함된 URL, 새 탭
  describe("FEEDME-033: ChatGPT에서 열기 링크 URL 검증", () => {
    it("마크다운 내용이 query에 포함된 ChatGPT URL이 새 탭 링크로 표시된다", async () => {
      const { user } = await renderWithContent("# Hello");

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("ChatGPT에서 열기")).toBeInTheDocument();
      });

      const chatgptLink = screen.getByRole("menuitem", { name: /ChatGPT에서 열기/ });
      const expectedHref = `https://chatgpt.com/?q=${encodeURIComponent("# Hello")}`;
      expect(chatgptLink).toHaveAttribute("href", expectedHref);
      expect(chatgptLink).toHaveAttribute("target", "_blank");
    });
  });

  // FEEDME-034: Claude에서 열기 → 마크다운 포함된 URL, 새 탭
  describe("FEEDME-034: Claude에서 열기 링크 URL 검증", () => {
    it("마크다운 내용이 query에 포함된 Claude URL이 새 탭 링크로 표시된다", async () => {
      const { user } = await renderWithContent("# Hello");

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("Claude에서 열기")).toBeInTheDocument();
      });

      const claudeLink = screen.getByRole("menuitem", { name: /Claude에서 열기/ });
      const expectedHref = `https://claude.ai/new?q=${encodeURIComponent("# Hello")}`;
      expect(claudeLink).toHaveAttribute("href", expectedHref);
      expect(claudeLink).toHaveAttribute("target", "_blank");
    });
  });

  // FEEDME-035: 초기 화면에서 split button 미표시
  describe("FEEDME-035: 초기 화면에서 split button 미표시", () => {
    it("콘텐츠가 추출되지 않은 초기 화면에서 split button이 표시되지 않는다", () => {
      render(<ContentExtractor />);

      expect(screen.queryByRole("button", { name: "복사하기" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /열기 옵션/i })
      ).not.toBeInTheDocument();
    });
  });

  // FEEDME-036: 마크다운 다운로드 항목 클릭 시 .md 파일 다운로드
  describe("FEEDME-036: 마크다운 다운로드 항목 클릭 시 파일 다운로드", () => {
    it("드롭다운에 '마크다운 다운로드' 항목이 맨 위에 표시된다", async () => {
      const { user } = await renderWithContent();

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("마크다운 다운로드")).toBeInTheDocument();
      });

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems[0]).toHaveTextContent("마크다운 다운로드");
    });

    it("'마크다운 다운로드' 항목에 아이콘이 있다", async () => {
      const { user } = await renderWithContent();

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("마크다운 다운로드")).toBeInTheDocument();
      });

      const downloadItem = screen.getByText("마크다운 다운로드");
      const downloadMenuItem = downloadItem.closest('[role="menuitem"]') ?? downloadItem.parentElement;
      const icon =
        downloadMenuItem!.querySelector("svg") ?? downloadMenuItem!.querySelector("img");
      expect(icon).not.toBeNull();
    });
  });
});
