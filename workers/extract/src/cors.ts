const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://feedme.vercel.app",
  "https://feedme-*.vercel.app",
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      return regex.test(origin);
    }
    return origin === pattern;
  });
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handlePreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;

  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 204 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin!),
  });
}

export function addCorsHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get("Origin");
  if (!origin || !isAllowedOrigin(origin)) return response;

  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}
