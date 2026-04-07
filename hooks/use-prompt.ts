"use client";

import { useState } from "react";
import { PRESETS } from "@/config/presets";

export function usePrompt() {
  const [prompt, setPrompt] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);

  const selectedPreset = (PRESETS as readonly string[]).includes(prompt) ? prompt : "";

  function reset() {
    setPrompt("");
    setPromptOpen(false);
  }

  return {
    prompt,
    setPrompt,
    promptOpen,
    setPromptOpen,
    selectedPreset,
    reset,
  };
}
