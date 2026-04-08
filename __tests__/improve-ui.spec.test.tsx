import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ContentExtractor from "@/components/content-extractor";

function mockText(markdown: string, meta: Record<string, string> = {}) {
  const entries = Object.entries(meta).filter(([, v]) => v != null);
  if (entries.length === 0) return markdown;
  const lines = ["---"];
  for (const [k, v] of entries) lines.push(`${k}: "${v}"`);
  lines.push("---");
  return `${lines.join("\n")}\n\n${markdown}`;
}

describe("improve-ui spec tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // FEEDME-010
  describe("FEEDME-010: 웹페이지 미리보기 높이 제한 없음", () => {
    it("웹페이지 콘텐츠 미리보기 영역에 max-height 관련 클래스가 없다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("# 긴 콘텐츠\n\n" + "본문 내용이 매우 길어집니다.\n\n".repeat(20)),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        expect(screen.getByText(/긴 콘텐츠/)).toBeInTheDocument();
      });

      const proseContainer = container.querySelector(".prose");
      expect(proseContainer).toBeTruthy();

      const classList = Array.from(proseContainer!.classList);
      const hasMaxHeight = classList.some(
        (cls) => cls.startsWith("max-h-") || cls === "overflow-y-auto"
      );
      expect(hasMaxHeight).toBe(false);
    });
  });

  // FEEDME-012
  describe("FEEDME-012: 미리보기 영역에 border 없음", () => {
    it("웹페이지 미리보기 영역에 border 관련 클래스가 없다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("# 테스트\n\n본문 내용"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        expect(screen.getByText(/테스트/)).toBeInTheDocument();
      });

      const proseContainer = container.querySelector(".prose");
      expect(proseContainer).toBeTruthy();

      const classList = Array.from(proseContainer!.classList);
      const hasBorder = classList.some(
        (cls) =>
          cls === "border" ||
          cls.startsWith("border-") ||
          cls === "rounded-md" ||
          cls === "rounded-lg"
      );
      expect(hasBorder).toBe(false);
    });

  });

  // FEEDME-013
  describe("FEEDME-013: 콘텐츠 영역 최대 너비 max-w-2xl 이상", () => {
    it("콘텐츠 영역에 max-w-2xl 이상의 클래스가 적용되어 있다", () => {
      const { container } = render(<ContentExtractor />);

      const wideContainerClasses = [
        "max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl",
        "max-w-6xl", "max-w-7xl", "max-w-full",
        "max-w-screen-sm", "max-w-screen-md", "max-w-screen-lg",
        "max-w-screen-xl", "max-w-screen-2xl",
      ];

      const hasWideContainer = wideContainerClasses.some((cls) =>
        container.querySelector(`.${cls}`)
      );

      expect(hasWideContainer).toBe(true);
    });
  });

  // FEEDME-014
  describe("FEEDME-014: 취소선 렌더링", () => {
    it("~~취소선 텍스트~~가 <del> 요소로 렌더링된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("~~취소선 텍스트~~"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        expect(container.querySelector(".prose")).toBeInTheDocument();
      });

      await waitFor(() => {
        const delElement = container.querySelector("del");
        expect(delElement).toBeInTheDocument();
        expect(delElement?.textContent).toBe("취소선 텍스트");
      });
    });
  });

  // FEEDME-015
  describe("FEEDME-015: 마크다운 테이블 렌더링", () => {
    it("마크다운 테이블이 <table> 요소로 렌더링된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("| 헤더1 | 헤더2 |\n|---|---|\n| 값1 | 값2 |"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        const tableElement = container.querySelector("table");
        expect(tableElement).toBeInTheDocument();
        expect(screen.getByText("값1")).toBeInTheDocument();
      });
    });
  });

  // FEEDME-016
  describe("FEEDME-016: 태스크리스트 렌더링", () => {
    it("태스크리스트가 체크박스(input[type='checkbox'])로 렌더링된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("- [x] 완료\n- [ ] 미완료"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes.length).toBeGreaterThanOrEqual(2);

        const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
        const uncheckedBoxes = container.querySelectorAll('input[type="checkbox"]:not(:checked)');
        expect(checkedBoxes.length).toBeGreaterThanOrEqual(1);
        expect(uncheckedBoxes.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // FEEDME-017
  describe("FEEDME-017: 언어 지정 코드 블록 하이라이팅", () => {
    it("언어가 지정된 코드 블록에 language-javascript 클래스가 존재한다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("```javascript\nconst x = 1;\n```"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        const codeElement = container.querySelector(".language-javascript");
        expect(codeElement).toBeInTheDocument();
      });
    });
  });

  // FEEDME-018
  describe("FEEDME-018: 자동 링크 렌더링", () => {
    it("URL 텍스트가 클릭 가능한 <a> 링크로 렌더링된다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("방문하세요 https://example.com 여기에"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        const linkElement = container.querySelector('a[href="https://example.com"]');
        expect(linkElement).toBeInTheDocument();
      });
    });
  });

  // FEEDME-019
  describe("FEEDME-019: 언어 미지정 코드 블록 하이라이팅 없음", () => {
    it("언어가 지정되지 않은 코드 블록에 하이라이팅 클래스가 없다", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockText("```\nplain text code\n```"),
      } as Response);

      const { container } = render(<ContentExtractor />);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://example.com/article");
      await user.click(screen.getByRole("button", { name: "가져오기" }));

      await waitFor(() => {
        const codeElement = container.querySelector("code");
        expect(codeElement).toBeInTheDocument();
      });

      const highlightedCode = container.querySelector("code[class*='hljs']");
      expect(highlightedCode).not.toBeInTheDocument();

      const languageCode = container.querySelector("code[class*='language-']");
      expect(languageCode).not.toBeInTheDocument();
    });
  });
});
