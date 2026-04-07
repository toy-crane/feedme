import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";
import type { ExtractResult } from "./types";

const BOT_UA = "Defuddle bot";

// GitHub 등 일부 사이트는 처음부터 bot UA를 사용해야 콘텐츠를 제공한다
const BOT_UA_DOMAINS = ["github.com", "raw.githubusercontent.com"];

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return (
    !contentType ||
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml")
  );
}

export function getInitialUA(url: string): string {
  try {
    const { hostname } = new URL(url);
    if (BOT_UA_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return BOT_UA;
    }
  } catch {
    // ignore
  }
  return "";
}

export function isValidUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isWatch =
      (parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com") &&
      parsed.pathname.startsWith("/watch");
    return isWatch || parsed.hostname === "youtu.be";
  } catch {
    return false;
  }
}

export function hasYouTubeTranscript(content: string): boolean {
  if (!content.trim()) return false;
  // 이미지 마크다운과 공백만 있는 경우 자막 없음으로 간주
  const withoutImages = content.replace(/!\[.*?\]\(.*?\)/g, "").trim();
  return withoutImages.length > 50;
}

function getYouTubeVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.pathname.includes("/shorts/"))
      return u.pathname.split("/shorts/")[1].split("/")[0];
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export async function extractYouTubeContent(url: string): Promise<ExtractResult> {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("페이지에 접근할 수 없습니다");
  }

  let title = "";
  let author = "";
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const resp = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(4000) });
    if (resp.ok) {
      const data = (await resp.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      title = data.title || "";
      author = data.author_name || "";
      thumbnailUrl = data.thumbnail_url || thumbnailUrl;
    }
  } catch {
    // oEmbed 실패 — 빈 메타데이터로 진행
  }

  // YoutubeExtractor가 메타데이터를 읽을 수 있도록 schema.org VideoObject가 포함된 최소 HTML 구성
  const schemaOrg = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    author,
    thumbnailUrl,
  });
  const pageTitle = title ? `${title} - YouTube` : "YouTube";
  const minimalHtml = `<!DOCTYPE html><html><head><title>${pageTitle}</title><script type="application/ld+json">${schemaOrg}<\/script></head><body></body></html>`;

  const { document } = parseHTML(minimalHtml);
  const result = await Defuddle(document, url, { markdown: true });

  const content = result.contentMarkdown ?? result.content ?? "";
  const hasTranscript = hasYouTubeTranscript(content);
  if (!hasTranscript) {
    throw new Error("자막을 찾을 수 없습니다");
  }

  return {
    type: "youtube",
    title: result.title ?? title,
    content: content.replace(/^##\s*Transcript\s*\n+/m, ""),
    source: (result.author ?? author) || undefined,
    thumbnail: (result.image ?? thumbnailUrl) || undefined,
  };
}

export async function extractContent(url: string): Promise<ExtractResult> {
  if (!isValidUrl(url)) {
    throw new Error("올바른 URL을 입력해주세요");
  }

  if (isYouTubeUrl(url)) {
    return extractYouTubeContent(url);
  }

  const initialUA = getInitialUA(url);
  const headers: HeadersInit = {};
  if (initialUA) {
    headers["User-Agent"] = initialUA;
  }

  let html: string;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    if (!isHtmlResponse(response)) {
      throw new Error("페이지에 접근할 수 없습니다");
    }

    html = await response.text();
  } catch (e) {
    if (e instanceof Error && e.message !== "페이지에 접근할 수 없습니다") {
      throw new Error("페이지에 접근할 수 없습니다");
    }
    throw e;
  }

  const { document } = parseHTML(html);
  let result = await Defuddle(document, url, { markdown: true });

  const wordCount = result.wordCount ?? 0;
  const content = result.contentMarkdown ?? result.content ?? "";
  if ((wordCount === 0 || content === "") && initialUA !== BOT_UA) {
    try {
      const botResponse = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": BOT_UA },
      });
      if (botResponse.ok && isHtmlResponse(botResponse)) {
        const botHtml = await botResponse.text();
        const { document: botDoc } = parseHTML(botHtml);
        const botResult = await Defuddle(botDoc, url, { markdown: true });
        const botContent = botResult.contentMarkdown ?? botResult.content ?? "";
        if (botContent !== "") {
          result = botResult;
        }
      }
    } catch {
      // bot UA 재시도 실패 — 원래 결과로 진행
    }
  }

  return {
    type: "webpage",
    title: result.title ?? "",
    content: result.contentMarkdown ?? result.content ?? "",
    thumbnail: result.image ?? undefined,
    source: result.author || new URL(url).hostname,
  };
}
