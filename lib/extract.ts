import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";
import { isValidUrl } from "@/lib/utils";

export interface ExtractResult {
  title: string;
  content: string;
  source?: string;
}

export async function extractContent(url: string): Promise<ExtractResult> {
  if (!isValidUrl(url)) {
    throw new Error("올바른 URL을 입력해주세요");
  }

  let html: string;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    html = await response.text();
  } catch {
    throw new Error("페이지에 접근할 수 없습니다");
  }

  const { document } = parseHTML(html);
  const result = await Defuddle(document, url, { markdown: true });

  return {
    title: result.title ?? "",
    content: result.contentMarkdown ?? result.content ?? "",
    source: result.author ?? result.site ?? undefined,
  };
}
