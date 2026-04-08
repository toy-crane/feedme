import { NextRequest, NextResponse } from "next/server";

const DEFUDDLE_API = "https://defuddle.md";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  const targetUrl = `${DEFUDDLE_API}/${url}`;

  try {
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": request.headers.get("User-Agent") || "",
      },
    });

    const body = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());

    console.log("[extract] upstream response", {
      targetUrl,
      status: response.status,
      headers: responseHeaders,
      bodyPreview: body.slice(0, 500),
    });

    if (!response.ok) {
      return new NextResponse(body, {
        status: response.status,
        headers: { "Content-Type": response.headers.get("Content-Type") || "text/plain" },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": response.headers.get("Content-Type") || "text/markdown" },
    });
  } catch (err) {
    console.error("[extract] fetch error", { targetUrl, error: String(err) });
    return NextResponse.json({ error: "Failed to fetch the URL" }, { status: 502 });
  }
}
