import { NextResponse } from "next/server";
import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";

const INNERTUBE_API_URL =
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const INNERTUBE_CLIENT_VERSION = "20.10.38";
const INNERTUBE_CONTEXT = {
  client: {
    clientName: "ANDROID",
    clientVersion: INNERTUBE_CLIENT_VERSION,
  },
};
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`;

const INNERTUBE_WEB_CONTEXT = {
  client: {
    clientName: "WEB",
    clientVersion: "2.20240101.00.00",
  },
};

async function testClient(
  name: string,
  context: object,
  videoId: string,
  userAgent?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (userAgent) headers["User-Agent"] = userAgent;

  try {
    const resp = await fetch(INNERTUBE_API_URL, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ context, videoId }),
    });

    const data = await resp.json();
    const captionTracks =
      data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    const playabilityStatus = data?.playabilityStatus?.status;

    return {
      client: name,
      httpStatus: resp.status,
      playabilityStatus,
      captionTrackCount: captionTracks.length,
      captionTracks: captionTracks.map((t: any) => ({
        lang: t.languageCode,
        kind: t.kind ?? "manual",
        hasBaseUrl: !!t.baseUrl,
      })),
      error: null,
    };
  } catch (e: any) {
    return {
      client: name,
      httpStatus: null,
      error: e.message ?? String(e),
    };
  }
}

async function testDefuddleE2E(url: string) {
  try {
    const fetchStart = Date.now();
    const resp = await fetch(url);
    const html = await resp.text();
    const fetchTime = Date.now() - fetchStart;

    const { document } = parseHTML(html);
    const defuddleStart = Date.now();
    const result = await Defuddle(document, url, { markdown: true });
    const defuddleTime = Date.now() - defuddleStart;

    const hasTranscript =
      (result.content?.length ?? 0) > 100 &&
      result.content?.includes("Transcript");

    return {
      htmlLength: html.length,
      fetchTimeMs: fetchTime,
      defuddleTimeMs: defuddleTime,
      extractorType: result.extractorType,
      title: result.title,
      contentMarkdownLength: result.contentMarkdown?.length ?? null,
      contentLength: result.content?.length ?? 0,
      contentPreview: result.content?.slice(0, 300),
      hasTranscript,
      error: null,
    };
  } catch (e: any) {
    return { error: e.message ?? String(e) };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("v") || "2wdsNwPUCgQ";
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const [android, web, e2e] = await Promise.all([
    testClient("ANDROID", INNERTUBE_CONTEXT, videoId, INNERTUBE_USER_AGENT),
    testClient("WEB", INNERTUBE_WEB_CONTEXT, videoId),
    testDefuddleE2E(youtubeUrl),
  ]);

  let captionFetchTest = null;
  const allResults = [android, web];
  const firstWithTrack = allResults.find(
    (r) => r.captionTrackCount && r.captionTrackCount > 0
  );

  if (firstWithTrack) {
    try {
      const ctx =
        firstWithTrack.client === "ANDROID"
          ? INNERTUBE_CONTEXT
          : INNERTUBE_WEB_CONTEXT;
      const ua =
        firstWithTrack.client === "ANDROID" ? INNERTUBE_USER_AGENT : undefined;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ua) headers["User-Agent"] = ua;

      const resp = await fetch(INNERTUBE_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ context: ctx, videoId }),
      });
      const data = await resp.json();
      const track =
        data?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0];
      if (track?.baseUrl) {
        const captionResp = await fetch(track.baseUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(4000),
        });
        captionFetchTest = {
          httpStatus: captionResp.status,
          contentLength: captionResp.headers.get("content-length"),
          preview: (await captionResp.text()).slice(0, 200),
        };
      }
    } catch (e: any) {
      captionFetchTest = { error: e.message };
    }
  }

  return NextResponse.json({
    videoId,
    timestamp: new Date().toISOString(),
    innertubeTests: { android, web },
    captionFetchTest,
    defuddleE2E: e2e,
  });
}
