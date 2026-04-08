import { NextRequest, NextResponse } from "next/server";
import type { ExtractResponse } from "@/types/extract";

const DEFUDDLE_API = "https://defuddle.md";

function isYouTubeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

function getYouTubeVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.pathname.includes("/shorts/"))
      return u.pathname.split("/shorts/")[1].split("/")[0];
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function parseFrontmatter(text: string): {
  metadata: Record<string, string>;
  content: string;
} {
  const match = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) return { metadata: {}, content: text };

  const metadata: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(": ");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 2).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    metadata[key] = value;
  }

  return { metadata, content: match[2] };
}

export async function POST(request: NextRequest) {
  let url: string;
  try {
    const body = await request.json();
    url = body.url;
  } catch {
    return NextResponse.json(
      { error: "올바른 JSON 형식이 아닙니다" },
      { status: 400 }
    );
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "올바른 URL을 입력해주세요" },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "올바른 URL을 입력해주세요" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${DEFUDDLE_API}/${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = "페이지에 접근할 수 없습니다";
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.error) message = parsed.error;
      } catch {
        // plain text error
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const text = await response.text();
    const { metadata, content } = parseFrontmatter(text);

    const isYT = isYouTubeUrl(url);
    let thumbnail: string | undefined;
    if (isYT) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    const result: ExtractResponse = {
      title: metadata.title || undefined,
      markdown: content,
      content,
      type: isYT ? "youtube" : "webpage",
      source: metadata.author || metadata.site || metadata.domain || undefined,
      thumbnail,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "페이지에 접근할 수 없습니다" },
      { status: 502 }
    );
  }
}
