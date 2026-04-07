import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ContentExtractor from "@/components/content-extractor";
import {
  renderWithContent,
  renderWithContentAndOpenCollapsible,
} from "@/__tests__/helpers";

describe("Pre-prompt", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // PROMPT-001: 콘텐츠 추출 후 '프롬프트 추가하기' 토글이 접힌 상태로 표시된다
  describe("PROMPT-001: 콘텐츠 추출 후 프롬프트 추가하기 토글 표시", () => {
    it("콘텐츠 추출 후 '프롬프트 추가하기' 토글이 접힌 상태로 표시된다", async () => {
      await renderWithContent();

      const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
      expect(trigger).toBeInTheDocument();

      expect(screen.queryByRole("textbox", { name: /프롬프트/i })).not.toBeInTheDocument();
    });
  });

  // PROMPT-002: 초기 화면에서 '프롬프트 추가하기' 토글이 표시되지 않는다
  describe("PROMPT-002: 초기 화면에서 프롬프트 추가하기 토글 미표시", () => {
    it("콘텐츠가 추출되지 않은 초기 화면에서 '프롬프트 추가하기' 토글이 표시되지 않는다", () => {
      render(<ContentExtractor />);

      expect(screen.queryByRole("button", { name: /프롬프트 추가하기/i })).not.toBeInTheDocument();
    });
  });

  // PROMPT-003: 토글 클릭 → Textarea와 프리셋 칩 3개 표시
  describe("PROMPT-003: 토글 클릭 시 Textarea와 프리셋 칩 표시", () => {
    it("'프롬프트 추가하기' 토글 클릭 시 Textarea와 프리셋 칩 3개가 표시된다", async () => {
      const { user } = await renderWithContent();

      const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("textbox", { name: /프롬프트/i })).toBeInTheDocument();
        expect(screen.getByText("요약해줘")).toBeInTheDocument();
        expect(screen.getByText("한국어로 번역해줘")).toBeInTheDocument();
        expect(screen.getByText("쉽게 설명해줘")).toBeInTheDocument();
      });
    });
  });

  // PROMPT-004: 펼쳐진 상태에서 토글 클릭 → Textarea와 칩 숨겨짐
  describe("PROMPT-004: 펼쳐진 상태에서 토글 클릭 시 Textarea와 칩 숨겨짐", () => {
    it("펼쳐진 상태에서 '프롬프트 추가하기' 토글 클릭 시 Textarea와 프리셋 칩이 숨겨진다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole("textbox", { name: /프롬프트/i })).not.toBeInTheDocument();
        expect(screen.queryByText("요약해줘")).not.toBeInTheDocument();
      });
    });
  });

  // PROMPT-005: 프리셋 칩 클릭 → Textarea에 텍스트 채워짐
  describe("PROMPT-005: 프리셋 칩 클릭 시 Textarea 채워짐", () => {
    it("'요약해줘' 프리셋 칩 클릭 시 Textarea에 '요약해줘'가 채워진다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("요약해줘"));

      expect(screen.getByRole("textbox", { name: /프롬프트/i })).toHaveValue("요약해줘");
    });

    it("'한국어로 번역해줘' 프리셋 칩 클릭 시 Textarea에 '한국어로 번역해줘'가 채워진다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("한국어로 번역해줘"));

      expect(screen.getByRole("textbox", { name: /프롬프트/i })).toHaveValue("한국어로 번역해줘");
    });

    it("'쉽게 설명해줘' 프리셋 칩 클릭 시 Textarea에 '쉽게 설명해줘'가 채워진다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("쉽게 설명해줘"));

      expect(screen.getByRole("textbox", { name: /프롬프트/i })).toHaveValue("쉽게 설명해줘");
    });
  });

  // PROMPT-006: 이미 선택된 칩 다시 클릭 → Textarea 비워지고 칩 선택 해제
  describe("PROMPT-006: 이미 선택된 칩 재클릭 시 Textarea 비워짐 및 선택 해제", () => {
    it("선택된 '요약해줘' 칩을 다시 클릭하면 Textarea가 비워지고 칩 선택이 해제된다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      const chip = screen.getByRole("radio", { name: "요약해줘" });
      await user.click(chip);
      expect(screen.getByRole("textbox", { name: /프롬프트/i })).toHaveValue("요약해줘");

      await user.click(chip);
      expect(screen.getByRole("textbox", { name: /프롬프트/i })).toHaveValue("");
    });
  });

  // PROMPT-007: Textarea 직접 수정 → 칩 선택 해제
  describe("PROMPT-007: Textarea 수정 시 칩 선택 해제", () => {
    it("프리셋 선택 후 Textarea 텍스트 수정 시 칩 선택이 해제된다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("요약해줘"));
      const textarea = screen.getByRole("textbox", { name: /프롬프트/i });
      expect(textarea).toHaveValue("요약해줘");

      await user.type(textarea, " 한국어로");

      const chip = screen.getByText("요약해줘").closest('[role="radio"]') ??
        screen.getByText("요약해줘").closest("button");
      expect(chip).not.toHaveAttribute("data-state", "on");
    });
  });

  // PROMPT-008: 복사 시 프롬프트+마크다운 합쳐서 클립보드에 복사
  describe("PROMPT-008: 복사 시 프롬프트+마크다운 합쳐서 클립보드 복사", () => {
    it("프롬프트 '요약해줘' + 마크다운 '# Hello' 복사 시 클립보드에 '요약해줘\\n\\n# Hello'가 복사된다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible("# Hello");

      await user.click(screen.getByText("요약해줘"));

      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);

      await user.click(screen.getByRole("button", { name: "복사하기" }));

      expect(writeText).toHaveBeenCalledWith("요약해줘\n\n# Hello");
    });

    it("빈 프롬프트 + 마크다운 '# Hello' 복사 시 클립보드에 '# Hello'만 복사된다", async () => {
      const { user } = await renderWithContent("# Hello");

      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);

      await user.click(screen.getByRole("button", { name: "복사하기" }));

      expect(writeText).toHaveBeenCalledWith("# Hello");
    });
  });

  // PROMPT-009: ChatGPT/Claude 링크에 프롬프트+마크다운 포함
  describe("PROMPT-009: ChatGPT/Claude 링크 URL에 프롬프트 포함", () => {
    it("프롬프트 '요약해줘' + 마크다운 '# Hello'일 때 ChatGPT URL에 프롬프트+마크다운 포함", async () => {
      const { user } = await renderWithContentAndOpenCollapsible("# Hello");

      await user.click(screen.getByText("요약해줘"));

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("ChatGPT에서 열기")).toBeInTheDocument();
      });

      const chatgptLink = screen.getByRole("menuitem", { name: /ChatGPT에서 열기/ });
      const expectedHref = `https://chatgpt.com/?q=${encodeURIComponent("요약해줘\n\n# Hello")}`;
      expect(chatgptLink).toHaveAttribute("href", expectedHref);
      expect(chatgptLink).toHaveAttribute("target", "_blank");
    });

    it("프롬프트 '요약해줘' + 마크다운 '# Hello'일 때 Claude URL에 프롬프트+마크다운 포함", async () => {
      const { user } = await renderWithContentAndOpenCollapsible("# Hello");

      await user.click(screen.getByText("요약해줘"));

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("Claude에서 열기")).toBeInTheDocument();
      });

      const claudeLink = screen.getByRole("menuitem", { name: /Claude에서 열기/ });
      const expectedHref = `https://claude.ai/new?q=${encodeURIComponent("요약해줘\n\n# Hello")}`;
      expect(claudeLink).toHaveAttribute("href", expectedHref);
      expect(claudeLink).toHaveAttribute("target", "_blank");
    });

    it("빈 프롬프트일 때 ChatGPT URL에 마크다운만 포함된다", async () => {
      const { user } = await renderWithContent("# Hello");

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("ChatGPT에서 열기")).toBeInTheDocument();
      });

      const chatgptLink = screen.getByRole("menuitem", { name: /ChatGPT에서 열기/ });
      const expectedHref = `https://chatgpt.com/?q=${encodeURIComponent("# Hello")}`;
      expect(chatgptLink).toHaveAttribute("href", expectedHref);
    });
  });

  // PROMPT-010: 다운로드는 마크다운만 포함 (프롬프트 제외)
  describe("PROMPT-010: 다운로드 시 마크다운만 포함 (프롬프트 제외)", () => {
    it("프롬프트 '요약해줘'가 입력된 상태에서 다운로드 시 마크다운만 다운로드된다", async () => {
      const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const { user } = await renderWithContentAndOpenCollapsible("# Hello");

      await user.click(screen.getByText("요약해줘"));

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("마크다운 다운로드")).toBeInTheDocument();
      });

      await user.click(screen.getByText("마크다운 다운로드"));

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const blob: Blob = createObjectURL.mock.calls[0][0];
      const text = await blob.text();
      expect(text).toBe("# Hello");
      expect(text).not.toContain("요약해줘");
    });
  });

  // PROMPT-011: 로고 클릭 → 프롬프트 비워지고 Collapsible 접히고 칩 선택 해제
  describe("PROMPT-011: 로고 클릭 시 프롬프트 초기화", () => {
    it("프롬프트가 입력되고 Collapsible이 펼쳐진 상태에서 로고 클릭 시 모두 초기화된다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("요약해줘"));
      const textarea = screen.getByRole("textbox", { name: /프롬프트/i });
      expect(textarea).toHaveValue("요약해줘");

      const logo = screen.getByTestId("logo");
      await user.click(logo);

      expect(screen.queryByRole("textbox", { name: /프롬프트/i })).not.toBeInTheDocument();
      expect(screen.queryByText("요약해줘")).not.toBeInTheDocument();
    });
  });

  // PROMPT-012: 프롬프트 입력 시 복사 버튼 아래에 '프롬프트 포함' 캡션 표시
  describe("PROMPT-012: 프롬프트 입력 시 '프롬프트 포함' 캡션 표시", () => {
    it("프롬프트가 입력되면 복사 버튼 아래에 '프롬프트 포함' 텍스트가 표시된다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("요약해줘"));

      expect(screen.getByText("프롬프트 포함")).toBeInTheDocument();
    });

    it("프롬프트가 비어있으면 '프롬프트 포함' 텍스트가 표시되지 않는다", async () => {
      await renderWithContent();

      expect(screen.queryByText("프롬프트 포함")).not.toBeInTheDocument();
    });
  });

  // PROMPT-013: 클리어 버튼 클릭 시 프롬프트 초기화
  describe("PROMPT-013: 클리어 버튼 클릭 시 프롬프트 초기화", () => {
    it("프롬프트가 입력된 상태에서 클리어 버튼 클릭 시 프롬프트가 비워지고 프리셋 선택이 해제된다", async () => {
      const { user } = await renderWithContentAndOpenCollapsible();

      await user.click(screen.getByText("요약해줘"));
      const textarea = screen.getByRole("textbox", { name: /프롬프트/i });
      expect(textarea).toHaveValue("요약해줘");

      const clearButton = screen.getByRole("button", { name: /프롬프트 지우기/i });
      await user.click(clearButton);

      expect(textarea).toHaveValue("");
      const chip = screen.getByRole("radio", { name: "요약해줘" });
      expect(chip).toHaveAttribute("aria-checked", "false");
    });
  });

  // PROMPT-014: 프롬프트가 비어있으면 클리어 버튼 미표시
  describe("PROMPT-014: 프롬프트가 비어있으면 클리어 버튼 미표시", () => {
    it("프롬프트가 비어있을 때 클리어 버튼이 표시되지 않는다", async () => {
      await renderWithContentAndOpenCollapsible();

      expect(screen.queryByRole("button", { name: /프롬프트 지우기/i })).not.toBeInTheDocument();
    });
  });
});
