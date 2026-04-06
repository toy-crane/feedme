"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { isValidUrl } from "@/lib/utils";

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

    if (!isValidUrl(url)) {
      setError("올바른 URL을 입력해주세요");
      return;
    }

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
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
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
            <InputGroup>
              <InputGroupInput
                id="url-input"
                type="url"
                placeholder="https://example.com 또는 YouTube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFetch();
                }}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="secondary" onClick={handleFetch} disabled={loading}>
                  가져오기
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>

        {loading && (
          <div role="status" className="flex justify-center py-4">
            <span className="text-muted-foreground">불러오는 중...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
            {result.title && (
              <h2 className="text-xl font-bold">{result.title}</h2>
            )}
            {result.channel && (
              <p className="text-sm text-muted-foreground">{result.channel}</p>
            )}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">자막</span>
                <Button variant="outline" onClick={handleCopy}>
                  복사
                </Button>
              </div>
              <div className="prose prose-sm max-w-none rounded-md border p-4 max-h-60 overflow-y-auto">
                <ReactMarkdown>{markdownText}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : markdownText && !loading ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">미리보기</span>
              <Button variant="outline" onClick={handleCopy}>
                복사
              </Button>
            </div>
            <div className="prose prose-sm max-w-none rounded-md border p-4 max-h-96 overflow-y-auto">
              <ReactMarkdown>{markdownText}</ReactMarkdown>
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
