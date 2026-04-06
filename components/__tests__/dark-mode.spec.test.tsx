/**
 * Dark Mode Spec Tests (수용 기준 테스트)
 *
 * spec.yaml의 dark-mode 시나리오를 검증한다.
 * 이 테스트는 구현 전 Red 단계 - 모두 FAIL 예상.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import ThemeToggle from "@/components/theme-toggle";

// next-themes 모킹
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

describe("dark-mode spec acceptance tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  // DARK-001: feedme 페이지 접속 시 화면 우측 상단에 테마 전환 토글 버튼이 fixed 위치로 표시된다
  describe("DARK-001: 테마 전환 토글 버튼이 fixed 위치로 표시", () => {
    it("ThemeToggle 컴포넌트가 렌더링되고 fixed 포지션을 가진다", () => {
      const { container } = render(<ThemeToggle />);

      // 토글 버튼이 존재해야 한다
      const toggleButton = screen.getByRole("button");
      expect(toggleButton).toBeInTheDocument();

      // fixed 포지션 클래스가 적용되어야 한다
      const fixedElement = container.querySelector(".fixed");
      expect(fixedElement).not.toBeNull();
    });
  });

  // DARK-002: 라이트 모드에서 테마 토글 클릭 시 다크 모드로 전환
  describe("DARK-002: 라이트 모드 → 다크 모드 전환", () => {
    it("라이트 모드에서 토글 클릭 시 html 요소에 dark 클래스가 적용된다", async () => {
      const { useTheme } = await import("next-themes");
      const mockSetTheme = vi.fn((newTheme: string) => {
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      });
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

      // 버튼이 있어야 한다 (현재 null 렌더링이므로 실패)
      const toggleButton = screen.getByRole("button");
      await user.click(toggleButton);

      // 클릭 후 dark 클래스가 적용되어야 한다
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  // DARK-003: 다크 모드에서 테마 토글 클릭 시 라이트 모드로 전환
  describe("DARK-003: 다크 모드 → 라이트 모드 전환", () => {
    it("다크 모드에서 토글 클릭 시 html 요소에서 dark 클래스가 제거된다", async () => {
      const { useTheme } = await import("next-themes");
      const mockSetTheme = vi.fn((newTheme: string) => {
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      });
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

      // 버튼이 있어야 한다 (현재 null 렌더링이므로 실패)
      const toggleButton = screen.getByRole("button");
      await user.click(toggleButton);

      // 클릭 후 dark 클래스가 제거되어야 한다
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  // DARK-004: OS 다크 모드 설정 + 첫 방문 시 다크 모드로 표시
  describe("DARK-004: OS 설정에 따른 초기 테마", () => {
    it("OS 다크 모드 설정 + 첫 방문 시 html에 dark 클래스가 적용된다", async () => {
      // window.matchMedia 모킹: prefers-color-scheme: dark
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

      const { useTheme } = await import("next-themes");
      vi.mocked(useTheme).mockReturnValue({
        theme: "system",
        setTheme: vi.fn(),
        resolvedTheme: "dark",
        themes: [],
        systemTheme: "dark",
        forcedTheme: undefined,
      });

      render(<ThemeToggle />);

      // OS 다크 모드 + 첫 방문 시 dark 클래스가 있어야 한다
      // ThemeProvider가 layout.tsx에서 html에 dark 클래스를 적용해야 함
      // 현재 구현 없으므로 실패 예상
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("OS 라이트 모드 설정 + 첫 방문 시 html에 dark 클래스가 없다", async () => {
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

      const { useTheme } = await import("next-themes");
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
    it("다크 모드 선택 후 새로고침 시 dark 클래스가 유지된다", async () => {
      // next-themes는 localStorage key로 'theme'을 사용
      localStorage.setItem("theme", "dark");

      const { useTheme } = await import("next-themes");
      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        resolvedTheme: "dark",
        themes: [],
        systemTheme: undefined,
        forcedTheme: undefined,
      });

      // 새로고침 시뮬레이션: localStorage에 theme이 있으면 dark 클래스 적용
      // ThemeProvider가 layout.tsx에서 이를 처리해야 함
      // 현재 구현 없으므로 실패 예상
      render(<ThemeToggle />);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("라이트 모드 선택 후 새로고침 시 dark 클래스가 없다", async () => {
      localStorage.setItem("theme", "light");

      const { useTheme } = await import("next-themes");
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
    it("다크 모드에서 코드 블록 컨테이너에 다크 테마 CSS가 적용된다", async () => {
      const { useTheme } = await import("next-themes");
      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        setTheme: vi.fn(),
        resolvedTheme: "dark",
        themes: [],
        systemTheme: undefined,
        forcedTheme: undefined,
      });

      document.documentElement.classList.add("dark");

      // 코드 블록을 ThemeToggle 렌더링 전에 DOM에 추가
      // (useEffect가 실행 시점에 존재하는 .hljs 요소에 data-dark-highlight 속성을 부여)
      const codeBlock = document.createElement("pre");
      const code = document.createElement("code");
      code.className = "hljs language-javascript";
      code.textContent = "const x = 1;";
      codeBlock.appendChild(code);
      document.body.appendChild(codeBlock);

      render(<ThemeToggle />);

      // 다크 모드 상태 확인
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // hljs 클래스가 있는 코드 블록이 존재해야 한다
      const hljsElement = document.querySelector(".hljs");
      expect(hljsElement).not.toBeNull();

      // 다크 모드에서 ThemeToggle의 useEffect가 .hljs 요소에 data-dark-highlight 속성을 부여해야 한다
      const darkThemeCodeBlock = document.querySelector("[data-dark-highlight='true']");
      expect(darkThemeCodeBlock).not.toBeNull();

      document.body.removeChild(codeBlock);
    });
  });
});
