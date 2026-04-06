export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 10;

const rateLimitStore = new Map<string, number[]>();

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

/** @returns allowed: 허용 여부, retryAfter: 재시도 가능 시간(초, 올림) */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = rateLimitStore.get(ip) ?? [];
  const recentTimestamps = timestamps.filter((ts) => ts > windowStart);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const resetAt = recentTimestamps[0] + RATE_LIMIT_WINDOW_MS;
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  recentTimestamps.push(now);
  rateLimitStore.set(ip, recentTimestamps);
  return { allowed: true };
}
