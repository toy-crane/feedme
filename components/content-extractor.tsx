"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { Separator } from "@/components/ui/separator";
import { REMARK_PLUGINS, REHYPE_PLUGINS } from "@/lib/markdown-plugins";
import { SplitCopyButton } from "@/components/split-copy-button";
import { UrlInputSection } from "@/components/url-input-section";
import { PromptEditor } from "@/components/prompt-editor";
import { FeedmeFooter } from "@/components/feedme-footer";
import { HyperText } from "@/components/ui/hyper-text";
import ThemeToggle from "@/components/theme-toggle";
import { useFeedme } from "@/hooks/use-feedme";

export default function ContentExtractor() {
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

        <UrlInputSection
          url={url}
          loading={loading}
          error={error}
          onUrlChange={setUrl}
          onErrorClear={() => setError(null)}
          onFetch={handleFetch}
        />

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

                <PromptEditor
                  prompt={prompt}
                  promptOpen={promptOpen}
                  selectedPreset={selectedPreset}
                  onPromptChange={setPrompt}
                  onPromptOpenChange={setPromptOpen}
                />
              </div>
              <Separator />
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>{markdownText}</ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>

      <FeedmeFooter />
    </div>
  );
}
