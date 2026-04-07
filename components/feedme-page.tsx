"use client";

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
import { ArrowRight, Loader2, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn, isValidUrl } from "@/lib/utils";
import { PRESETS } from "@/config/presets";
import { REMARK_PLUGINS, REHYPE_PLUGINS } from "@/lib/markdown-plugins";
import { SplitCopyButton } from "@/components/split-copy-button";
import { HyperText } from "@/components/ui/hyper-text";
import ThemeToggle from "@/components/theme-toggle";
import { useFeedme } from "@/hooks/use-feedme";

export default function FeedmePage() {
  const {
    url, setUrl,
    loading,
    error, setError,
    result,
    copied,
    prompt, setPrompt,
    promptOpen, setPromptOpen,
    markdownText,
    selectedPreset,
    handleReset,
    handleFetch,
    handleCopy,
  } = useFeedme();

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
