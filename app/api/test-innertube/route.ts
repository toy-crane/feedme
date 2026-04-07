import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("v") || "2wdsNwPUCgQ";

  const [android, web] = await Promise.all([
    testClient("ANDROID", INNERTUBE_CONTEXT, videoId, INNERTUBE_USER_AGENT),
    testClient("WEB", INNERTUBE_WEB_CONTEXT, videoId),
  ]);

  // Also test fetching actual caption XML if we got a track
  let captionFetchTest = null;
  const allResults = [android, web];
  const firstWithTrack = allResults.find(
    (r) => r.captionTrackCount && r.captionTrackCount > 0
  );

  if (firstWithTrack) {
    try {
      // Re-fetch to get baseUrl
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
    results: { android, web },
    captionFetchTest,
  });
}
