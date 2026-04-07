"use client";

import { buildCopyText } from "@/lib/utils";
import { useExtract } from "@/hooks/use-extract";
import { usePrompt } from "@/hooks/use-prompt";
import { useClipboard } from "@/hooks/use-clipboard";

export function useFeedme() {
  const extract = useExtract();
  const prompt = usePrompt();
  const clipboard = useClipboard();

  function handleReset() {
    extract.reset();
    prompt.reset();
    clipboard.reset();
  }

  async function handleCopy() {
    if (!extract.markdownText) return;
    await clipboard.handleCopy(
      buildCopyText(prompt.prompt, extract.markdownText)
    );
  }

  return {
    url: extract.url,
    setUrl: extract.setUrl,
    loading: extract.loading,
    error: extract.error,
    setError: extract.setError,
    result: extract.result,
    copied: clipboard.copied,
    prompt: prompt.prompt,
    setPrompt: prompt.setPrompt,
    promptOpen: prompt.promptOpen,
    setPromptOpen: prompt.setPromptOpen,
    markdownText: extract.markdownText,
    selectedPreset: prompt.selectedPreset,
    handleReset,
    handleFetch: extract.handleFetch,
    handleCopy,
  };
}
