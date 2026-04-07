const CACHE_TTL = 3600; // 1시간

export function getCacheKey(url: string): Request {
  return new Request(
    `https://cache.feedme.workers.dev/${encodeURIComponent(url)}`,
    { method: "GET" }
  );
}

export async function getCachedResponse(url: string): Promise<Response | undefined> {
  const cache = caches.default;
  const cacheKey = getCacheKey(url);
  return await cache.match(cacheKey);
}

export function cacheResponse(
  url: string,
  response: Response,
  ctx: ExecutionContext
): void {
  const cache = caches.default;
  const cacheKey = getCacheKey(url);
  const responseToCache = new Response(response.body, response);
  responseToCache.headers.set("Cache-Control", `s-maxage=${CACHE_TTL}`);
  ctx.waitUntil(cache.put(cacheKey, responseToCache));
}
