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

  // FEEDME-032: © 2026 feed-me 텍스트 표시
  describe("FEEDME-032: 카피라이트 텍스트", () => {
    it("footer에 '© 2026 feed-me' 텍스트가 표시된다", () => {
      render(<FeedmePage />);

      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveTextContent("© 2026 feed-me");
    });
  });

  // FEEDME-033: by toy-crane 링크가 노션 프로필로 연결
  describe("FEEDME-033: by toy-crane 링크", () => {
    it("footer에 'by toy-crane' 링크가 노션 프로필 페이지로 연결된다", () => {
      render(<FeedmePage />);

      const link = screen.getByRole("link", { name: /by toy-crane/i });
      expect(link).toBeVisible();
      expect(link).toHaveAttribute(
        "href",
        "https://toycrane.notion.site/Toy-Crane-e1083f83d3864669bf27290a8f033b00"
      );
    });
  });
});
