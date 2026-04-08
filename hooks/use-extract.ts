"use client";

import { useState } from "react";
import type { ExtractResponse } from "@/types/extract";

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
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as { error?: string } & ExtractResponse;

      if (!response.ok) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다");
        return;
      }

      setResult(data as ExtractResponse);
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
