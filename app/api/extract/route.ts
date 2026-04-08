import { NextRequest, NextResponse } from "next/server";

const DEFUDDLE_API = "https://defuddle.md";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${DEFUDDLE_API}/${url}`, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": request.headers.get("User-Agent") || "",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { "Content-Type": response.headers.get("Content-Type") || "text/plain" },
      });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": response.headers.get("Content-Type") || "text/markdown" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch the URL" }, { status: 502 });
  }
}
