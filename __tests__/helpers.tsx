import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ContentExtractor from "@/components/content-extractor";

function buildDefuddleText(
  markdown: string,
  meta: Record<string, string | undefined> = {}
): string {
  const entries = Object.entries(meta).filter(([, v]) => v != null);
  if (entries.length === 0) return markdown;
  const lines = ["---"];
  for (const [k, v] of entries) lines.push(`${k}: "${v}"`);
  lines.push("---");
  return `${lines.join("\n")}\n\n${markdown}`;
}

export async function renderWithContent(
  markdown = "# Hello",
  { title, type }: { title?: string; type?: string } = {}
) {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => buildDefuddleText(markdown, { title }),
  } as Response);

  render(<ContentExtractor />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  });

  return { user };
}

export async function renderWithContentAndOpenCollapsible(markdown = "# Hello") {
  const { user } = await renderWithContent(markdown);

  const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
  await user.click(trigger);

  await waitFor(() => {
    expect(screen.getByRole("textbox", { name: /프롬프트/i })).toBeInTheDocument();
  });

  return { user };
}

export async function renderWithWebpageResult({
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
    text: async () => buildDefuddleText(content, { title, author, domain }),
  } as Response);

  render(<ContentExtractor />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  });

  return { user };
}

export async function renderWithYoutubeResult({
  source = "Rick Astley",
  title = "YouTube 테스트",
  content = "# YouTube 콘텐츠",
}: {
  source?: string;
  title?: string;
  content?: string;
} = {}) {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => buildDefuddleText(content, { title, author: source, site: "YouTube" }),
  } as Response);

  render(<ContentExtractor />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "복사하기" })).toBeInTheDocument();
  });

  return { user };
}
