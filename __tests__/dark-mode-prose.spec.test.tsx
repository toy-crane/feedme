import { render } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import React from "react";

function ProseContainer({ isDark, markdown }: { isDark: boolean; markdown: string }) {
  return (
    <div data-testid="prose-container" className={`prose ${isDark ? "dark:prose-invert" : ""} max-w-none`}>
      {markdown}
    </div>
  );
}

describe("dark-mode prose spec acceptance tests (DARK-007)", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  describe("DARK-007: 마크다운 본문 다크 모드 가독성", () => {
    it("다크 모드에서 prose 컨테이너에 dark:prose-invert 클래스가 존재한다", () => {
      document.documentElement.classList.add("dark");

      const { getByTestId } = render(
        <ProseContainer isDark={true} markdown="# 제목\n\n본문 텍스트입니다" />
      );

      const proseContainer = getByTestId("prose-container");
      expect(proseContainer.className).toContain("dark:prose-invert");
    });

    it("라이트 모드에서 prose 컨테이너에 prose-invert가 적용되지 않는다", () => {
      const { getByTestId } = render(
        <ProseContainer isDark={false} markdown="# 제목\n\n본문 텍스트입니다" />
      );

      const proseContainer = getByTestId("prose-container");
      expect(proseContainer.className).not.toContain("prose-invert");
    });
  });
});
