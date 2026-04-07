"use client";

import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ArrowRight, Loader2, Copy, Check, ChevronDown, ChevronRight, Download, Plus, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn, isValidUrl, buildCopyText } from "@/lib/utils";
import type { ExtractResponse } from "@/types/extract";
import { PRESETS } from "@/config/presets";
import { REMARK_PLUGINS, REHYPE_PLUGINS } from "@/lib/markdown-plugins";
import { CHATGPT_ICON, CLAUDE_ICON } from "@/components/icons";
import { HyperText } from "@/components/ui/hyper-text";
import ThemeToggle from "@/components/theme-toggle";

export default function FeedmePage() {
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

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex justify-end -mb-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-1">
          <div
            data-testid="logo"
            className="cursor-pointer"
            onClick={handleReset}
          >
            <span className="sr-only">Feed-me</span>
            <HyperText
              as="h1"
              className="text-5xl font-bold"
              aria-hidden="true"
            >
              Feed-me
            </HyperText>
          </div>
          <p className="text-muted-foreground">
            어떤 URL이든, Markdown으로.
          </p>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="url-input" className="sr-only">
              URL
            </FieldLabel>
            <InputGroup className="h-12">
              <InputGroupInput
                id="url-input"
                name="url"
                type="url"
                autoComplete="url"
                placeholder="https://example.com 또는 YouTube URL"
                value={url}
                aria-invalid={!!error}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isValidUrl(url) && !loading) handleFetch();
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="default"
                  size="icon-lg"
                  onClick={() => { if (isValidUrl(url) && !loading) handleFetch(); }}
                  aria-disabled={loading || !isValidUrl(url)}
                  aria-label="가져오기"
                  className={cn((loading || !isValidUrl(url)) && "pointer-events-auto opacity-50 cursor-not-allowed")}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <div aria-live="polite">
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
            </div>
          </Field>
        </FieldGroup>

        {result && markdownText && !loading && (
          <>
            <Separator />
            <div data-testid="result-container" className="flex flex-col gap-4">
              {result.thumbnail && (
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  <Image
                    src={result.thumbnail}
                    alt={result.title ?? "썸네일"}
                    fill
                    sizes="(max-width: 672px) 100vw, 672px"
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                {result.title && (
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold">{result.title}</h2>
                    {result.source && (
                      <p className="text-sm text-muted-foreground">{result.source}</p>
                    )}
                  </div>
                )}
                <div className="flex flex-col items-end gap-1">
                  <SplitCopyButton
                    markdown={markdownText}
                    prompt={prompt}
                    copied={copied}
                    onCopy={handleCopy}
                    title={result?.title}
                  />
                  {prompt && (
                    <p className="text-xs text-muted-foreground">프롬프트 포함</p>
                  )}
                </div>

                <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground px-0"
                    >
                      <Plus data-icon="inline-start" aria-hidden="true" />
                      프롬프트 추가하기
                      {promptOpen ? (
                        <ChevronDown data-icon="inline-end" aria-hidden="true" />
                      ) : (
                        <ChevronRight data-icon="inline-end" aria-hidden="true" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-2 pt-2">
                      <Field>
                        <FieldLabel htmlFor="prompt-input" className="sr-only">
                          프롬프트
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupTextarea
                            id="prompt-input"
                            placeholder="ex) 이 글을 요약해줘"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={2}
                          />
                          {prompt && (
                            <InputGroupAddon align="inline-end" className="self-start pt-2">
                              <InputGroupButton
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setPrompt("")}
                                aria-label="프롬프트 지우기"
                              >
                                <X />
                              </InputGroupButton>
                            </InputGroupAddon>
                          )}
                        </InputGroup>
                      </Field>
                      <ToggleGroup
                        type="single"
                        value={selectedPreset}
                        onValueChange={setPrompt}
                        spacing={2}
                        className="flex flex-wrap justify-start"
                      >
                        {PRESETS.map((preset) => (
                          <ToggleGroupItem
                            key={preset}
                            value={preset}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                          >
                            {preset}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <Separator />
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>{markdownText}</ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="mt-auto w-full pt-16 pb-7 text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <span>© 2026 feed-me</span>
            <span>·</span>
            <a
              href="https://github.com/toy-crane/feedme/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Feedback
            </a>
            <span>·</span>
            <a
              href="https://github.com/toy-crane/feedme"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
          <a
            href="https://toycrane.notion.site/Toy-Crane-e1083f83d3864669bf27290a8f033b00"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs"
          >
            by toy-crane
          </a>
        </div>
      </footer>
    </div>
  );
}

function SplitCopyButton({
  markdown,
  prompt,
  copied,
  onCopy,
  title,
}: {
  markdown: string;
  prompt: string;
  copied: boolean;
  onCopy: () => void;
  title?: string;
}) {
  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title ? `${title}.md` : "feedme.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const copyText = buildCopyText(prompt, markdown);

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        data-copied={copied ? "true" : undefined}
      >
        {copied ? (
          <Check data-testid="copy-check-icon" data-icon="inline-start" />
        ) : (
          <Copy data-icon="inline-start" />
        )}
        복사하기
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="열기 옵션"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleDownload}>
              <Download data-icon="inline-start" aria-hidden="true" />
              마크다운 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://chatgpt.com/?q=${encodeURIComponent(copyText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CHATGPT_ICON}
                ChatGPT에서 열기
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://claude.ai/new?q=${encodeURIComponent(copyText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CLAUDE_ICON}
                Claude에서 열기
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
