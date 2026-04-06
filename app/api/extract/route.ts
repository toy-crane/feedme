import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";
import { checkRateLimit } from "@/lib/ratelimit";

const ERROR_STATUS_MAP: Record<string, number> = {
  "올바른 URL을 입력해주세요": 400,
  "페이지에 접근할 수 없습니다": 502,
  "자막을 찾을 수 없습니다": 422,
};

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해주세요` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { url } = body as { url: string };

  try {
    const result = await extractContent(url);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다";
    const status = ERROR_STATUS_MAP[message] ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
