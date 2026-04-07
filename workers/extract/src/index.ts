import { extractContent } from "./extract";
import { checkRateLimit, getClientIp } from "./ratelimit";
import { handlePreflight, addCorsHeaders } from "./cors";
import { getCachedResponse, cacheResponse } from "./cache";

const ERROR_STATUS_MAP: Record<string, number> = {
  "올바른 URL을 입력해주세요": 400,
  "페이지에 접근할 수 없습니다": 502,
  "자막을 찾을 수 없습니다": 422,
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const preflight = handlePreflight(request);
    if (preflight) return preflight;

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // body 파싱을 rate limit 전에 실행: 잘못된 JSON이면 rate limit을 소비하지 않음
    let body: { url: string };
    try {
      body = await request.json() as { url: string };
    } catch {
      return addCorsHeaders(
        Response.json({ error: "올바른 URL을 입력해주세요" }, { status: 400 }),
        request
      );
    }

    const ip = getClientIp(request);
    const { allowed } = await checkRateLimit(ip, env.RATE_LIMIT);
    if (!allowed) {
      return addCorsHeaders(
        Response.json(
          { error: "요청 한도를 초과했습니다. 내일 다시 시도해주세요" },
          { status: 429 }
        ),
        request
      );
    }

    const cached = await getCachedResponse(body.url);
    if (cached) {
      return addCorsHeaders(cached, request);
    }

    try {
      const result = await extractContent(body.url);
      const response = Response.json(result);
      if (result.content) {
        cacheResponse(body.url, response.clone(), ctx);
      }
      return addCorsHeaders(response, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다";
      const status = ERROR_STATUS_MAP[message] ?? 500;
      return addCorsHeaders(Response.json({ error: message }, { status }), request);
    }
  },
} satisfies ExportedHandler<Env>;
