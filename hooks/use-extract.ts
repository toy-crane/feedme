"use client";

import { useState } from "react";
import type { ExtractResponse } from "@/types/extract";

const EXTRACT_API = "/api/extract";

function parseFrontmatter(text: string): {
  metadata: Record<string, string>;
  content: string;
} {
  const match = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) return { metadata: {}, content: text };

  const metadata: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(": ");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 2).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    metadata[key] = value;
  }

  return { metadata, content: match[2] };
}

function isYouTubeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "youtu.be"
    );
  } catch {
    return false;
  }
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

export function useExtract() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);

  const markdownText = result?.markdown ?? result?.content ?? null;

  async function handleFetch() {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${EXTRACT_API}?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(15_000) }
      );

      if (!response.ok) {
        let message = "페이지에 접근할 수 없습니다";
        try {
          const errorBody = await response.text();
          const parsed = JSON.parse(errorBody);
          if (parsed.error) message = parsed.error;
        } catch {
          // plain text error
        }
        setError(message);
        return;
      }

      const text = await response.text();
      const { metadata, content } = parseFrontmatter(text);

      const isYT = isYouTubeUrl(url);
      let thumbnail: string | undefined;
      if (isYT) {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
          thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }
      }

      setResult({
        title: metadata.title || undefined,
        markdown: content,
        content,
        type: isYT ? "youtube" : "webpage",
        source: metadata.author || metadata.site || metadata.domain || undefined,
        thumbnail,
      });
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setUrl("");
    setResult(null);
    setError(null);
    setLoading(false);
  }

  return {
    url,
    setUrl,
    loading,
    error,
    setError,
    result,
    markdownText,
    handleFetch,
    reset,
  };
}
