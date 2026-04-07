export const DAILY_RATE_LIMIT = 100;

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export function getRateLimitKey(ip: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return `rate:${ip}:${date}`;
}

export async function checkRateLimit(
  ip: string,
  kv: KVNamespace
): Promise<{ allowed: boolean }> {
  const key = getRateLimitKey(ip);
  const current = parseInt((await kv.get(key)) ?? "0", 10);

  if (current >= DAILY_RATE_LIMIT) {
    return { allowed: false };
  }

  await kv.put(key, String(current + 1), { expirationTtl: 86400 });
  return { allowed: true };
}
