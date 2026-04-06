import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";

const ERROR_STATUS_MAP: Record<string, number> = {
  "올바른 URL을 입력해주세요": 400,
  "페이지에 접근할 수 없습니다": 502,
  "자막을 찾을 수 없습니다": 422,
};

export async function POST(request: NextRequest) {
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
