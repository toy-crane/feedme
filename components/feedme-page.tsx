"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import type { PluggableList } from "unified";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { ArrowRight, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { isValidUrl } from "@/lib/utils";

const REMARK_PLUGINS: PluggableList = [remarkGfm];
const REHYPE_PLUGINS: PluggableList = [rehypeHighlight];

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

  const markdownText = result?.markdown ?? result?.content ?? null;

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
    await navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">feedme</h1>
          <p className="text-muted-foreground">
            URL을 입력하면 웹페이지나 YouTube 자막을 마크다운으로 추출합니다
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
                  className={loading || !isValidUrl(url) ? "pointer-events-auto opacity-50 cursor-not-allowed" : ""}
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

        {(result && markdownText && !loading) && (
          <Separator />
        )}

        {result && markdownText && !loading && result.type === "youtube" ? (
          <div className="flex flex-col gap-4">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt={result.title ?? "YouTube 썸네일"}
                className="w-full rounded-lg"
                style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
              />
            )}
            <div className="flex items-start justify-between">
              {result.title && (
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold">{result.title}</h2>
                  {result.channel && (
                    <p className="text-sm text-muted-foreground">{result.channel}</p>
                  )}
                </div>
              )}
              <Button variant="outline" onClick={handleCopy}>
                복사
              </Button>
            </div>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>{markdownText}</ReactMarkdown>
            </div>
          </div>
        ) : markdownText && !loading ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              {result?.title && (
                <h2 className="text-2xl font-bold">{result.title}</h2>
              )}
              <Button variant="outline" onClick={handleCopy}>
                복사
              </Button>
            </div>
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>{markdownText}</ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>

      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2 rounded-md text-sm">
          복사됨
        </div>
      )}
    </div>
  );
}
