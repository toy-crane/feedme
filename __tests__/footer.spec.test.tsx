import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FeedmePage from "@/components/feedme-page";

describe("feedme-footer spec acceptance tests", () => {
  // FEEDME-030: footer에 Feedback 링크가 GitHub Issue 작성 페이지로 연결
  describe("FEEDME-030: Feedback 링크", () => {
    it("footer에 'Feedback' 링크가 GitHub Issue 작성 페이지로 연결된다", () => {
      render(<FeedmePage />);

      const link = screen.getByRole("link", { name: /feedback/i });
      expect(link).toBeVisible();
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/toy-crane/feedme/issues/new"
      );
    });
  });

  // FEEDME-031: footer에 GitHub 링크가 레포지토리 페이지로 연결
  describe("FEEDME-031: GitHub 링크", () => {
    it("footer에 'GitHub' 링크가 레포지토리 페이지로 연결된다", () => {
      render(<FeedmePage />);

      const link = screen.getByRole("link", { name: /github/i });
      expect(link).toBeVisible();
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/toy-crane/feedme"
      );
    });
  });
});
