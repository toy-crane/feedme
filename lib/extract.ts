import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";
import { isValidUrl } from "@/lib/utils";

export interface ExtractResult {
  title: string;
  content: string;
  type: "webpage" | "youtube";
  source?: string;
  thumbnail?: string;
}

function hasYouTubeTranscript(content: string): boolean {
  if (!content.trim()) return false;
  // 이미지 마크다운과 공백만 있는 경우 자막 없음으로 간주
  const withoutImages = content.replace(/!\[.*?\]\(.*?\)/g, "").trim();
  return withoutImages.length > 50;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isWatch =
      (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") &&
      parsed.pathname.startsWith("/watch");
    return isWatch || parsed.hostname === "youtu.be";
  } catch {
    return false;
  }
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

  if (isYouTubeUrl(url)) {
    const content = result.contentMarkdown ?? result.content ?? "";
    const hasTranscript = hasYouTubeTranscript(content);
    if (!hasTranscript) {
      throw new Error("자막을 찾을 수 없습니다");
    }

    return {
      type: "youtube",
      title: result.title ?? "",
      content,
      source: result.author ?? undefined,
      thumbnail: result.image ?? undefined,
    };
  }

  return {
    type: "webpage",
    title: result.title ?? "",
    content: result.contentMarkdown ?? result.content ?? "",
    thumbnail: result.image ?? undefined,
    source: result.author || new URL(url).hostname,
  };
}
