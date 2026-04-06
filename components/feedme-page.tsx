"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import type { PluggableList } from "unified";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ArrowRight, Loader2, Copy, Check, ChevronDown, ChevronRight, Download, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { HyperText } from "@/components/ui/hyper-text";
import ThemeToggle from "@/components/theme-toggle";

const REMARK_PLUGINS: PluggableList = [remarkGfm];
const REHYPE_PLUGINS: PluggableList = [rehypeHighlight];

const PRESETS = ["요약해줘", "한국어로 번역해줘", "쉽게 설명해줘"] as const;

type ExtractResult = {
  markdown?: string;
  content?: string;
  title?: string;
  type?: string;
  channel?: string;
  thumbnail?: string;
};

export default function FeedmePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptOpen, setPromptOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const markdownText = result?.markdown ?? result?.content ?? null;

  function handleReset() {
    setUrl("");
    setResult(null);
    setError(null);
    setCopied(false);
    setLoading(false);
    setPrompt("");
    setPromptOpen(false);
    setSelectedPreset(null);
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

      setResult(data as ExtractResult);
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

  function handlePresetChange(value: string) {
    if (!value) {
      // toggling off
      setSelectedPreset(null);
      setPrompt("");
    } else {
      setSelectedPreset(value);
      setPrompt(value);
    }
  }

  function handlePromptChange(value: string) {
    setPrompt(value);
    // auto-deselect preset if text doesn't match
    if (selectedPreset !== null && value !== selectedPreset) {
      setSelectedPreset(null);
    }
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
            <div className={cn("flex flex-col", result.type === "youtube" ? "gap-4" : "gap-3")}>
              {result.type === "youtube" && result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt={result.title ?? "YouTube 썸네일"}
                  className="w-full rounded-lg"
                  style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
                />
              )}
              <div className="flex flex-col gap-1">
                {result.title && (
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold">{result.title}</h2>
                    {result.type === "youtube" && result.channel && (
                      <p className="text-sm text-muted-foreground">{result.channel}</p>
                    )}
                  </div>
                )}
                <div className="flex justify-end">
                  <SplitCopyButton
                    markdown={markdownText}
                    prompt={prompt}
                    copied={copied}
                    onCopy={handleCopy}
                    title={result?.title}
                  />
                </div>

                <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm text-muted-foreground bg-transparent border-none cursor-pointer p-0"
                    >
                      <Plus data-icon="inline-start" />
                      <span>프롬프트 추가하기</span>
                      {promptOpen ? (
                        <ChevronDown data-icon="inline-end" aria-hidden="true" />
                      ) : (
                        <ChevronRight data-icon="inline-end" aria-hidden="true" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-2 pt-2">
                      <Field>
                        <FieldLabel htmlFor="prompt-input" className="sr-only">
                          프롬프트
                        </FieldLabel>
                        <Textarea
                          id="prompt-input"
                          placeholder="ex) 이 글을 요약해줘"
                          value={prompt}
                          onChange={(e) => handlePromptChange(e.target.value)}
                          rows={2}
                        />
                      </Field>
                      <ToggleGroup
                        type="single"
                        value={selectedPreset ?? ""}
                        onValueChange={handlePresetChange}
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

const CHATGPT_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" fill="currentColor" />
  </svg>
);

const CLAUDE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4.714 15.956 4.718-2.648.079-.23-.08-.128h-.23l-.79-.048-2.695-.073-2.337-.097-2.265-.122-.57-.121-.535-.704.055-.353.48-.321.685.06 1.518.104 2.277.157 1.651.098 2.447.255h.389l.054-.158-.133-.097-.103-.098-2.356-1.596-2.55-1.688-1.336-.972-.722-.491L2 6.223l-.158-1.008.655-.722.88.06.225.061.893.686 1.906 1.476 2.49 1.833.364.304.146-.104.018-.072-.164-.274-1.354-2.446-1.445-2.49-.644-1.032-.17-.619a2.972 2.972 0 0 1-.103-.729L6.287.133 6.7 0l.995.134.42.364.619 1.415L9.735 4.14l1.555 3.03.455.898.243.832.09.255h.159V9.01l.127-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.583.28.48.685-.067.444-.286 1.851-.558 2.903-.365 1.942h.213l.243-.242.983-1.306 1.652-2.064.728-.82.85-.904.547-.431h1.032l.759 1.129-.34 1.166-1.063 1.347-.88 1.142-1.263 1.7-.79 1.36.074.11.188-.02 2.853-.606 1.542-.28 1.84-.315.832.388.09.395-.327.807-1.967.486-2.307.462-3.436.813-.043.03.049.061 1.548.146.662.036h1.62l3.018.225.79.522.473.638-.08.485-1.213.62-1.64-.389-3.825-.91-1.31-.329h-.183v.11l1.093 1.068 2.003 1.81 2.508 2.33.127.578-.321.455-.34-.049-2.204-1.657-.85-.747-1.925-1.62h-.127v.17l.443.649 2.343 3.521.122 1.08-.17.353-.607.213-.668-.122-1.372-1.924-1.415-2.168-1.141-1.943-.14.08-.674 7.254-.316.37-.728.28-.607-.461-.322-.747.322-1.476.388-1.924.316-1.53.285-1.9.17-.632-.012-.042-.14.018-1.432 1.967-2.18 2.945-1.724 1.845-.413.164-.716-.37.066-.662.401-.589 2.386-3.036 1.439-1.882.929-1.086-.006-.158h-.055L4.138 18.56l-1.13.146-.485-.456.06-.746.231-.243 1.907-1.312Z" fill="currentColor" />
  </svg>
);

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
