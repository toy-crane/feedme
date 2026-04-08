"use client";

import { useState } from "react";
import type { ExtractResponse } from "@/types/extract";

const EXTRACT_API = "/api/extract";

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
        { signal: AbortSignal.timeout(15_000) },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "페이지에 접근할 수 없습니다");
        return;
      }

      setResult({
        title: data.title || undefined,
        markdown: data.content,
        content: data.content,
        type: "webpage",
        source: data.source || undefined,
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
