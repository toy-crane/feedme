"use client";

import { useState } from "react";

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setCopied(false);
  }

  return {
    copied,
    handleCopy,
    reset,
  };
}
