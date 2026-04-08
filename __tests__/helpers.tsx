import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ContentExtractor from "@/components/content-extractor";

function jsonResponse(
  data: Record<string, unknown>,
  ok = true,
) {
  return {
    ok,
    json: async () => data,
  } as Response;
}

export async function renderWithContent(
  markdown = "# Hello",
  { title }: { title?: string } = {},
) {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue(
    jsonResponse({ title, content: markdown }),
  );

  render(<ContentExtractor />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "복사하기" }),
    ).toBeInTheDocument();
  });

  return { user };
}

export async function renderWithContentAndOpenCollapsible(
  markdown = "# Hello",
) {
  const { user } = await renderWithContent(markdown);

  const trigger = screen.getByRole("button", { name: /프롬프트 추가하기/i });
  await user.click(trigger);

  await waitFor(() => {
    expect(
      screen.getByRole("textbox", { name: /프롬프트/i }),
    ).toBeInTheDocument();
  });

  return { user };
}

export async function renderWithWebpageResult({
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
  global.fetch = vi.fn().mockResolvedValue(
    jsonResponse({
      title,
      content,
      source: author || domain || undefined,
    }),
  );

  render(<ContentExtractor />);

  const input = screen.getByRole("textbox");
  await user.type(input, "https://example.com");
  await user.click(screen.getByRole("button", { name: "가져오기" }));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "복사하기" }),
    ).toBeInTheDocument();
  });

  return { user };
}
