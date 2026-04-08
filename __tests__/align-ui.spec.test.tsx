import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithWebpageResult } from "@/__tests__/helpers";

describe("align-ui", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ALIGN-001: OG 이미지가 있는 웹페이지 → 썸네일 img가 16:9 비율로 표시됨
  describe("ALIGN-001: OG 이미지가 있는 웹페이지 → 16:9 썸네일 표시", () => {
    // Defuddle API frontmatter에 thumbnail이 포함되지 않아 웹페이지 썸네일 미지원
    it.skip("OG 이미지가 있는 웹페이지 추출 시 썸네일 img가 16:9 비율로 표시된다", async () => {
      await renderWithWebpageResult({
        thumbnail: "https://example.com/og-image.jpg",
      });

      const thumbnail = screen.getByRole("img", { name: /테스트 제목|썸네일/i });
      expect(thumbnail).toBeInTheDocument();

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

  // ALIGN-005: 웹페이지 결과의 요소 순서와 gap
  describe("ALIGN-005: 웹페이지 결과의 요소 순서와 gap", () => {
    it("웹페이지 결과의 최상위 컨테이너 gap이 gap-4이다", async () => {
      await renderWithWebpageResult({});

      const container = document.querySelector("[data-testid='result-container']");
      expect(container).not.toBeNull();
      const className = container?.getAttribute("class") ?? "";
      expect(className).toContain("gap-4");
    });
  });

  // ALIGN-009: 프롬프트 영역과 본문 사이에 구분선
  describe("ALIGN-009: 프롬프트 영역과 본문 사이 구분선", () => {
    it("웹페이지 결과에서 프롬프트 영역과 본문 사이에 Separator가 표시된다", async () => {
      await renderWithWebpageResult({});

      const container = document.querySelector("[data-testid='result-container']");
      expect(container).not.toBeNull();

      const separators = container!.querySelectorAll('[role="separator"], [data-slot="separator"]');
      expect(separators.length).toBeGreaterThanOrEqual(1);
    });
  });
});
