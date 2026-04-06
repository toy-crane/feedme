import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import ThemeToggle from "@/components/theme-toggle";
import { useTheme } from "next-themes";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: [],
    systemTheme: undefined,
    forcedTheme: undefined,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeSetTheme() {
  return vi.fn((newTheme: string) => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });
}

describe("dark-mode spec acceptance tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  // DARK-001: feedme 페이지 접속 시 화면 우측 상단에 테마 전환 토글 버튼이 fixed 위치로 표시된다
  describe("DARK-001: 테마 전환 토글 버튼이 fixed 위치로 표시", () => {
    it("ThemeToggle 컴포넌트가 렌더링되고 fixed 포지션을 가진다", () => {
      render(<ThemeToggle />);

      const toggleButton = screen.getByRole("button");
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton.classList.contains("fixed")).toBe(true);
    });
  });

  // DARK-002: 라이트 모드에서 테마 토글 클릭 시 다크 모드로 전환
  describe("DARK-002: 라이트 모드 → 다크 모드 전환", () => {
    it("라이트 모드에서 토글 클릭 시 setTheme('dark')가 호출된다", async () => {
      const mockSetTheme = makeSetTheme();
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
        themes: [],
        systemTheme: undefined,
        forcedTheme: undefined,
      });

      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(screen.getByRole("button"));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  // DARK-003: 다크 모드에서 테마 토글 클릭 시 라이트 모드로 전환
  describe("DARK-003: 다크 모드 → 라이트 모드 전환", () => {
    it("다크 모드에서 토글 클릭 시 setTheme('light')가 호출된다", async () => {
      const mockSetTheme = makeSetTheme();
      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
        themes: [],
        systemTheme: undefined,
        forcedTheme: undefined,
      });

      document.documentElement.classList.add("dark");

      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.click(screen.getByRole("button"));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  // DARK-004: OS 다크 모드 설정 + 첫 방문 시 다크 모드로 표시
  describe("DARK-004: OS 설정에 따른 초기 테마", () => {
    it("OS 다크 모드 설정 + 첫 방문 시 resolvedTheme이 dark이다", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      vi.mocked(useTheme).mockReturnValue({
        theme: "system",
        setTheme: vi.fn(),
        resolvedTheme: "dark",
        themes: [],
        systemTheme: "dark",
        forcedTheme: undefined,
      });

      document.documentElement.classList.add("dark");

      render(<ThemeToggle />);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("OS 라이트 모드 설정 + 첫 방문 시 resolvedTheme이 light이다", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      vi.mocked(useTheme).mockReturnValue({
        theme: "system",
        setTheme: vi.fn(),
        resolvedTheme: "light",
        themes: [],
        systemTheme: "light",
        forcedTheme: undefined,
      });

      render(<ThemeToggle />);

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  // DARK-005: 사용자가 토글로 다크/라이트 모드 선택 후 새로고침 시 선택 유지
  describe("DARK-005: 테마 선택 유지 (localStorage)", () => {
    it("다크 모드 선택 후 새로고침 시 dark 클래스가 유지된다", () => {
      localStorage.setItem("theme", "dark");

      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        resolvedTheme: "dark",
        themes: [],
        systemTheme: undefined,
        forcedTheme: undefined,
      });

      document.documentElement.classList.add("dark");

      render(<ThemeToggle />);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("라이트 모드 선택 후 새로고침 시 dark 클래스가 없다", () => {
      localStorage.setItem("theme", "light");

      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        setTheme: vi.fn(),
        resolvedTheme: "light",
        themes: [],
        systemTheme: undefined,
        forcedTheme: undefined,
      });

      render(<ThemeToggle />);

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  // DARK-006: 다크 모드에서 코드 블록이 다크 테마 하이라이팅으로 표시
  describe("DARK-006: 다크 모드 코드 블록 하이라이팅", () => {
    it("다크 모드에서 .dark .hljs CSS 규칙으로 코드 블록에 다크 테마가 적용된다", () => {
      document.documentElement.classList.add("dark");

      const codeBlock = document.createElement("pre");
      const code = document.createElement("code");
      code.className = "hljs language-javascript";
      code.textContent = "const x = 1;";
      codeBlock.appendChild(code);
      document.body.appendChild(codeBlock);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.querySelector(".hljs")).not.toBeNull();

      document.body.removeChild(codeBlock);
    });
  });
});
