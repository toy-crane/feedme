"use client";

import { useState } from "react";
import type { ExtractResponse } from "@/types/extract";
import { buildCopyText } from "@/lib/utils";
import { PRESETS } from "@/config/presets";

export function useFeedme() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);

  const markdownText = result?.markdown ?? result?.content ?? null;
  const selectedPreset = (PRESETS as readonly string[]).includes(prompt) ? prompt : "";

  function handleReset() {
    setUrl("");
    setResult(null);
    setError(null);
    setCopied(false);
    setLoading(false);
    setPrompt("");
    setPromptOpen(false);
  }

  async function handleFetch() {
    setError(null);
    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

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

  async function handleCopy() {
    if (!markdownText) return;
    await navigator.clipboard.writeText(buildCopyText(prompt, markdownText));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return {
    url,
    setUrl,
    loading,
    error,
    setError,
    result,
    copied,
    prompt,
    setPrompt,
    promptOpen,
    setPromptOpen,
    markdownText,
    selectedPreset,
    handleReset,
    handleFetch,
    handleCopy,
  };
}
