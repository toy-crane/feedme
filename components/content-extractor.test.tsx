import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentExtractor from "@/components/content-extractor";

const SAMPLE_MARKDOWN = "# Hello World\n\nThis is sample content.";

async function renderWithExtractedContent(markdown = SAMPLE_MARKDOWN) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ markdown, title: "Hello World", type: "webpage" }),
  });

  const user = userEvent.setup();
  render(<ContentExtractor />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");

  const button = screen.getByRole("button", { name: "가져오기" });
  await user.click(button);

  // 결과가 표시될 때까지 대기
  await screen.findByRole("button", { name: /복사/ });

  return user;
}

describe("feedme-page unit tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe("버튼 비활성화 상태 (isValidUrl 기반)", () => {
    it("URL이 빈 문자열일 때 가져오기 버튼이 비활성화된다", () => {
      render(<ContentExtractor />);

      const button = screen.getByRole("button", { name: "가져오기" });

      // URL input은 비어있는 초기 상태
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("URL이 유효하지 않은 값(not-a-url)일 때 가져오기 버튼이 비활성화된다", async () => {
      const user = userEvent.setup();
      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("URL이 유효한 값(https://example.com)일 때 가져오기 버튼이 활성화된다", async () => {
      const user = userEvent.setup();
      render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");

      const button = screen.getByRole("button", { name: "가져오기" });
      expect(button).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  // FEEDME-031: 복사 버튼 클릭 시 clipboard API 호출
  describe("복사 버튼 클릭 시 클립보드에 마크다운 복사 (FEEDME-031)", () => {
    it("메인 '복사' 버튼 클릭 시 navigator.clipboard.writeText가 마크다운 내용으로 호출된다", async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const copyButton = screen.getByRole("button", { name: /복사/ });
      await userEvent.setup().click(copyButton);

      expect(writeTextSpy).toHaveBeenCalledWith(SAMPLE_MARKDOWN);
    });

    it("복사 후 버튼 아이콘이 체크 아이콘으로 바뀐다", async () => {
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const copyButton = screen.getByRole("button", { name: /복사/ });
      await userEvent.setup().click(copyButton);

      // 체크 아이콘이 표시되는지 확인 (aria-label 또는 data-testid 기반)
      expect(screen.getByTestId("copy-check-icon")).toBeInTheDocument();
    });

    it("복사 후 토스트 메시지가 표시되지 않는다", async () => {
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const copyButton = screen.getByRole("button", { name: /복사/ });
      await userEvent.setup().click(copyButton);

      expect(screen.queryByText("복사됨")).not.toBeInTheDocument();
    });
  });

  // FEEDME-033: ChatGPT URL 생성
  describe("드롭다운 'ChatGPT에서 열기' 링크 URL 검증 (FEEDME-033)", () => {
    it("'ChatGPT에서 열기' 링크의 href가 encodeURIComponent된 마크다운을 포함한다", async () => {
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // Radix DropdownMenuItem asChild로 렌더된 <a>는 role="menuitem"을 가짐
      const chatgptLink = screen.getByRole("menuitem", { name: /ChatGPT에서 열기/ });
      const expectedHref = `https://chatgpt.com/?q=${encodeURIComponent(SAMPLE_MARKDOWN)}`;
      expect(chatgptLink).toHaveAttribute("href", expectedHref);
    });

    it("'ChatGPT에서 열기' 링크에 target='_blank' 속성이 있다", async () => {
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // Radix DropdownMenuItem asChild로 렌더된 <a>는 role="menuitem"을 가짐
      const chatgptLink = screen.getByRole("menuitem", { name: /ChatGPT에서 열기/ });
      expect(chatgptLink).toHaveAttribute("target", "_blank");
    });
  });

  // FEEDME-034: Claude URL 생성
  describe("드롭다운 'Claude에서 열기' 링크 URL 검증 (FEEDME-034)", () => {
    it("'Claude에서 열기' 링크의 href가 encodeURIComponent된 마크다운을 포함한다", async () => {
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // Radix DropdownMenuItem asChild로 렌더된 <a>는 role="menuitem"을 가짐
      const claudeLink = screen.getByRole("menuitem", { name: /Claude에서 열기/ });
      const expectedHref = `https://claude.ai/new?q=${encodeURIComponent(SAMPLE_MARKDOWN)}`;
      expect(claudeLink).toHaveAttribute("href", expectedHref);
    });

    it("'Claude에서 열기' 링크에 target='_blank' 속성이 있다", async () => {
      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // Radix DropdownMenuItem asChild로 렌더된 <a>는 role="menuitem"을 가짐
      const claudeLink = screen.getByRole("menuitem", { name: /Claude에서 열기/ });
      expect(claudeLink).toHaveAttribute("target", "_blank");
    });
  });

  // FEEDME-036: 마크다운 다운로드
  describe("마크다운 다운로드 기능 (FEEDME-036)", () => {
    it("다운로드 항목 클릭 시 Blob URL이 생성된다", async () => {
      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/test");
      const revokeObjectURLSpy = vi.fn();
      global.URL.createObjectURL = createObjectURLSpy;
      global.URL.revokeObjectURL = revokeObjectURLSpy;

      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // 다운로드 직전에 spy 설정
      const clickSpy = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          node.click = clickSpy;
        }
        return node;
      });
      const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

      const downloadItem = screen.getByRole("menuitem", { name: /마크다운 다운로드/ });
      await userEvent.setup().click(downloadItem);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it("다운로드 시 title이 있으면 '{title}.md' 파일명이 설정된다", async () => {
      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/test");
      global.URL.createObjectURL = createObjectURLSpy;
      global.URL.revokeObjectURL = vi.fn();

      await renderWithExtractedContent(SAMPLE_MARKDOWN);

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // 다운로드 직전에 spy 설정
      let anchorElement: HTMLAnchorElement | null = null;
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          anchorElement = node;
          node.click = vi.fn();
        }
        return node;
      });
      const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

      const downloadItem = screen.getByRole("menuitem", { name: /마크다운 다운로드/ });
      await userEvent.setup().click(downloadItem);

      expect(anchorElement).not.toBeNull();
      expect((anchorElement as HTMLAnchorElement).download).toBe("Hello World.md");

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it("다운로드 시 title이 없으면 'feedme.md' fallback 파일명이 설정된다", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ markdown: SAMPLE_MARKDOWN, title: null, type: "webpage" }),
      });

      const createObjectURLSpy = vi.fn().mockReturnValue("blob:http://localhost/test");
      global.URL.createObjectURL = createObjectURLSpy;
      global.URL.revokeObjectURL = vi.fn();

      const user = userEvent.setup();
      render(<ContentExtractor />);
      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com");
      await user.click(screen.getByRole("button", { name: "가져오기" }));
      await screen.findByRole("button", { name: /복사/ });

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/ });
      await userEvent.setup().click(chevronButton);

      // 다운로드 직전에 spy 설정
      let anchorElement: HTMLAnchorElement | null = null;
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          anchorElement = node;
          node.click = vi.fn();
        }
        return node;
      });
      const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

      const downloadItem = screen.getByRole("menuitem", { name: /마크다운 다운로드/ });
      await userEvent.setup().click(downloadItem);

      expect(anchorElement).not.toBeNull();
      expect((anchorElement as HTMLAnchorElement).download).toBe("feedme.md");

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe("onChange 핸들러가 에러 상태를 초기화한다", () => {
    it("에러가 표시된 상태에서 URL 입력 시 에러가 사라진다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      render(<ContentExtractor />);

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
