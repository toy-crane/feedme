import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FeedmePage from "@/components/feedme-page";

async function renderWithContent(markdown = "# Hello") {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ markdown }),
  } as Response);

  render(<FeedmePage />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  });

  return { user };
}

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

  // ──────────────────────────────────────────────
  // improve-copy-button feature (FEEDME-030 ~ 035)
  // ──────────────────────────────────────────────

  // FEEDME-030: 콘텐츠 추출 후 split button 표시
  describe("FEEDME-030: 콘텐츠 추출 후 split button 표시", () => {
    it("복사 아이콘+텍스트 메인 버튼과 chevron 버튼이 함께 표시된다", async () => {
      await renderWithContent();

      // 메인 복사 버튼
      const copyButton = screen.getByRole("button", { name: "복사하기" });
      expect(copyButton).toBeInTheDocument();

      // 복사 버튼 안에 아이콘(svg)이 있어야 한다
      const iconInCopyButton = copyButton.querySelector("svg");
      expect(iconInCopyButton).not.toBeNull();

      // chevron 버튼 (열기 옵션 드롭다운 트리거)
      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      expect(chevronButton).toBeInTheDocument();
    });
  });

  // FEEDME-031: 메인 복사 버튼 클릭 → 클립보드 복사 + 체크 아이콘 (토스트 없음)
  describe("FEEDME-031: 메인 복사 버튼 클릭 시 클립보드 복사 및 체크 아이콘 표시", () => {
    it("클립보드에 마크다운이 복사되고 버튼 아이콘이 체크로 바뀐다", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      const { user } = await renderWithContent("# Hello");

      // renderWithContent 호출 이후 clipboard mock 설정
      // (userEvent.setup()이 내부적으로 clipboard를 교체할 수 있으므로 이후에 재설정)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      const copyButton = screen.getByRole("button", { name: "복사하기" });
      await user.click(copyButton);

      // 클립보드에 내용이 복사되어야 한다
      expect(writeText).toHaveBeenCalledWith("# Hello");

      // 버튼에 체크 아이콘이 표시되어야 한다 (lucide Check 아이콘은 특정 path를 가짐)
      await waitFor(() => {
        const updatedButton = screen.getByRole("button", { name: "복사하기" });
        // 체크 상태 표시 확인: aria-label 변경 또는 data 속성, 혹은 아이콘 변경
        // 구현에서 data-copied="true" 속성 또는 아이콘이 바뀌어야 함
        expect(updatedButton).toHaveAttribute("data-copied", "true");
      });

      // 토스트 메시지('복사됨' fixed div)가 표시되지 않아야 한다
      expect(screen.queryByText("복사됨")).not.toBeInTheDocument();
    });
  });

  // FEEDME-032: chevron 버튼 클릭 → 드롭다운 메뉴에 3개 항목 표시
  describe("FEEDME-032: chevron 버튼 클릭 시 드롭다운 메뉴 표시", () => {
    it("마크다운 다운로드, ChatGPT에서 열기, Claude에서 열기 항목이 아이콘과 함께 표시된다", async () => {
      const { user } = await renderWithContent();

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      // 드롭다운 메뉴가 표시되어야 한다
      await waitFor(() => {
        expect(screen.getByText("마크다운 다운로드")).toBeInTheDocument();
        expect(screen.getByText("ChatGPT에서 열기")).toBeInTheDocument();
        expect(screen.getByText("Claude에서 열기")).toBeInTheDocument();
      });

      // 각 메뉴 항목에 아이콘(svg 또는 img)이 있어야 한다
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

  // FEEDME-036: 마크다운 다운로드 항목 클릭 시 .md 파일 다운로드
  describe("FEEDME-036: 마크다운 다운로드 항목 클릭 시 파일 다운로드", () => {
    it("드롭다운에 '마크다운 다운로드' 항목이 맨 위에 표시된다", async () => {
      const { user } = await renderWithContent();

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("마크다운 다운로드")).toBeInTheDocument();
      });

      // '마크다운 다운로드' 항목이 드롭다운 첫 번째 항목이어야 한다
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

  // FEEDME-033: ChatGPT에서 열기 → 마크다운 포함된 URL, 새 탭
  describe("FEEDME-033: ChatGPT에서 열기 링크 URL 검증", () => {
    it("마크다운 내용이 query에 포함된 ChatGPT URL이 새 탭 링크로 표시된다", async () => {
      const { user } = await renderWithContent("# Hello");

      const chevronButton = screen.getByRole("button", { name: /열기 옵션/i });
      await user.click(chevronButton);

      await waitFor(() => {
        expect(screen.getByText("ChatGPT에서 열기")).toBeInTheDocument();
      });

      // Radix DropdownMenuItem asChild로 렌더된 <a>는 role="menuitem"을 가짐
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

      // Radix DropdownMenuItem asChild로 렌더된 <a>는 role="menuitem"을 가짐
      const claudeLink = screen.getByRole("menuitem", { name: /Claude에서 열기/ });
      const expectedHref = `https://claude.ai/new?q=${encodeURIComponent("# Hello")}`;
      expect(claudeLink).toHaveAttribute("href", expectedHref);
      expect(claudeLink).toHaveAttribute("target", "_blank");
    });
  });

  // FEEDME-035: 초기 화면에서 split button 미표시
  describe("FEEDME-035: 초기 화면에서 split button 미표시", () => {
    it("콘텐츠가 추출되지 않은 초기 화면에서 split button이 표시되지 않는다", () => {
      render(<FeedmePage />);

      // 메인 복사 버튼이 없어야 한다
      expect(screen.queryByRole("button", { name: "복사하기" })).not.toBeInTheDocument();

      // chevron 버튼도 없어야 한다
      expect(
        screen.queryByRole("button", { name: /열기 옵션/i })
      ).not.toBeInTheDocument();
    });
  });
});

describe("Pre-prompt", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 콘텐츠 추출 후 Collapsible을 열어놓는 헬퍼
  async function renderWithContentAndOpenCollapsible(markdown = "# Hello") {
    const { user } = await renderWithContent(markdown);

    const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /프롬프트/i })).toBeInTheDocument();
    });

    return { user };
  }

  // PROMPT-001: 콘텐츠 추출 후 '프롬프트 추가하기' 토글이 접힌 상태로 표시된다
  describe("PROMPT-001: 콘텐츠 추출 후 프롬프트 추가하기 토글 표시", () => {
    it("콘텐츠 추출 후 '프롬프트 추가하기' 토글이 접힌 상태로 표시된다", async () => {
      await renderWithContent();

      const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
      expect(trigger).toBeInTheDocument();

      // Collapsible이 접힌 상태 확인 - textarea나 프리셋 칩이 보이지 않아야 한다
      expect(screen.queryByRole("textbox", { name: /프롬프트/i })).not.toBeInTheDocument();
    });
  });

  // PROMPT-002: 초기 화면에서 '프롬프트 추가하기' 토글이 표시되지 않는다
  describe("PROMPT-002: 초기 화면에서 프롬프트 추가하기 토글 미표시", () => {
    it("콘텐츠가 추출되지 않은 초기 화면에서 '프롬프트 추가하기' 토글이 표시되지 않는다", () => {
      render(<FeedmePage />);

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

      // 텍스트 수정 (추가 입력)
      await user.type(textarea, " 한국어로");

      // 프리셋 칩이 선택 해제 상태여야 한다 (aria-pressed=false 또는 data-state=off)
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

      // createObjectURL이 "# Hello"만 포함된 Blob으로 호출되었는지 확인
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

      // 로고 클릭
      const logo = screen.getByTestId("logo");
      await user.click(logo);

      // Collapsible이 접혀야 한다 - textarea가 사라져야 한다
      expect(screen.queryByRole("textbox", { name: /프롬프트/i })).not.toBeInTheDocument();

      // 프리셋 칩도 사라져야 한다
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
      // 프리셋 칩이 선택 해제되어야 한다
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
        expect(screen.getByText("복사하기")).toBeInTheDocument();
      });

      // 로고 클릭
      const logo = screen.getByTestId("logo");
      await user.click(logo);

      // URL 입력값이 비워져야 한다
      expect(input).toHaveValue("");

      // 미리보기(결과)가 사라져야 한다
      expect(screen.queryByText("# 추출된 콘텐츠")).not.toBeInTheDocument();

      // 복사 버튼이 사라져야 한다
      expect(screen.queryByText("복사하기")).not.toBeInTheDocument();

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
      expect(screen.queryByText("복사하기")).not.toBeInTheDocument();
    });
  });
});

// ──────────────────────────────────────────────
// align-ui feature (ALIGN-001 ~ 005)
// ──────────────────────────────────────────────

async function renderWithWebpageResult({
  thumbnail,
  author,
  domain,
  title = "테스트 제목",
  content = "# 테스트 콘텐츠",
}: {
  thumbnail?: string;
  author?: string;
  domain?: string;
  title?: string;
  content?: string;
}) {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      content,
      title,
      type: "webpage",
      thumbnail,
      source: author ?? domain,
    }),
  } as Response);

  render(<FeedmePage />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  });

  return { user };
}

async function renderWithYoutubeResult({
  thumbnail = "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  source = "Rick Astley",
  title = "YouTube 테스트",
  content = "# YouTube 콘텐츠",
}: {
  thumbnail?: string;
  source?: string;
  title?: string;
  content?: string;
} = {}) {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      content,
      title,
      type: "youtube",
      thumbnail,
      source,
    }),
  } as Response);

  render(<FeedmePage />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  });

  return { user };
}

describe("align-ui", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ALIGN-001: OG 이미지가 있는 웹페이지 → 썸네일 img가 16:9 비율로 표시됨
  describe("ALIGN-001: OG 이미지가 있는 웹페이지 → 16:9 썸네일 표시", () => {
    it("OG 이미지가 있는 웹페이지 추출 시 썸네일 img가 16:9 비율로 표시된다", async () => {
      await renderWithWebpageResult({
        thumbnail: "https://example.com/og-image.jpg",
      });

      const thumbnail = screen.getByRole("img", { name: /테스트 제목|썸네일/i });
      expect(thumbnail).toBeInTheDocument();

      // 16:9 비율 스타일 확인 (next/image wrapper div에 aspect-ratio 적용)
      const wrapper = thumbnail.closest("div[style]");
      const style = wrapper?.getAttribute("style") ?? "";
      const hasAspectRatio =
        style.includes("aspect-ratio") ||
        style.includes("16 / 9");
      expect(hasAspectRatio).toBe(true);
    });
  });

  // ALIGN-002: OG 이미지가 없는 웹페이지 → 썸네일 img가 없음
  describe("ALIGN-002: OG 이미지가 없는 웹페이지 → 썸네일 없음", () => {
    it("OG 이미지가 없는 웹페이지 추출 시 썸네일 img가 표시되지 않는다", async () => {
      await renderWithWebpageResult({
        thumbnail: undefined,
      });

      const thumbnails = screen.queryAllByRole("img");
      expect(thumbnails).toHaveLength(0);
    });
  });

  // ALIGN-003: author가 있는 웹페이지 → 출처에 author 텍스트 표시
  describe("ALIGN-003: author가 있는 웹페이지 → 출처에 author 표시", () => {
    it("author가 있는 웹페이지 추출 시 출처에 author 이름이 표시된다", async () => {
      await renderWithWebpageResult({
        author: "홍길동",
      });

      expect(screen.getByText("홍길동")).toBeInTheDocument();
    });
  });

  // ALIGN-004: author가 없는 웹페이지 → 출처에 도메인명 표시
  describe("ALIGN-004: author가 없는 웹페이지 → 출처에 도메인명 표시", () => {
    it("author가 없는 웹페이지 추출 시 출처에 도메인명이 표시된다", async () => {
      await renderWithWebpageResult({
        author: undefined,
        domain: "example.com",
      });

      expect(screen.getByText("example.com")).toBeInTheDocument();
    });
  });

  // ALIGN-005: YouTube/웹페이지 결과의 요소 순서와 gap이 동일
  describe("ALIGN-005: YouTube/웹페이지 결과의 요소 순서와 gap이 동일", () => {
    it("YouTube 결과의 최상위 컨테이너 gap이 gap-4이다", async () => {
      await renderWithYoutubeResult();

      const separator = document.querySelector("[data-testid='result-container']");
      expect(separator).not.toBeNull();
      const className = separator?.getAttribute("class") ?? "";
      expect(className).toContain("gap-4");
    });

    it("웹페이지 결과의 최상위 컨테이너 gap이 gap-4이다", async () => {
      await renderWithWebpageResult({
        thumbnail: "https://example.com/og.jpg",
      });

      const container = document.querySelector("[data-testid='result-container']");
      expect(container).not.toBeNull();
      const className = container?.getAttribute("class") ?? "";
      expect(className).toContain("gap-4");
    });

    it("YouTube와 웹페이지 결과의 요소 순서가 동일하다 (썸네일 → 제목/출처 → 액션 → 콘텐츠)", async () => {
      // YouTube 결과에서 요소 순서 검증
      await renderWithYoutubeResult();

      const container = document.querySelector("[data-testid='result-container']");
      expect(container).not.toBeNull();

      const children = Array.from(container!.children);
      // 첫 번째 자식: 썸네일 wrapper div (next/image)
      const firstChild = children[0];
      expect(firstChild.tagName.toLowerCase()).toBe("div");
      expect(firstChild.querySelector("img")).not.toBeNull();
      // 두 번째 자식: 메타 정보 div (제목/출처)
      const secondChild = children[1];
      expect(secondChild.tagName.toLowerCase()).toBe("div");
    });
  });

  // ALIGN-009: 프롬프트 영역과 본문 사이에 구분선
  describe("ALIGN-009: 프롬프트 영역과 본문 사이 구분선", () => {
    it("YouTube 결과에서 프롬프트 영역과 본문 사이에 Separator가 표시된다", async () => {
      await renderWithYoutubeResult();

      const container = document.querySelector("[data-testid='result-container']");
      expect(container).not.toBeNull();

      const separators = container!.querySelectorAll('[role="separator"], [data-slot="separator"]');
      expect(separators.length).toBeGreaterThanOrEqual(1);
    });

    it("웹페이지 결과에서 프롬프트 영역과 본문 사이에 Separator가 표시된다", async () => {
      await renderWithWebpageResult({});

      const container = document.querySelector("[data-testid='result-container']");
      expect(container).not.toBeNull();

      const separators = container!.querySelectorAll('[role="separator"], [data-slot="separator"]');
      expect(separators.length).toBeGreaterThanOrEqual(1);
    });
  });
});
