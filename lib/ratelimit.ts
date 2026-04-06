export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 10;

// IP별 요청 타임스탬프 목록을 저장하는 Map
const rateLimitStore = new Map<string, number[]>();

/**
 * 테스트에서 상태를 초기화할 때 사용한다
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * IP 기반 rate limit을 확인한다
 * @param ip 요청 IP 주소
 * @returns allowed: 허용 여부, retryAfter: 재시도 가능 시간(초, 올림)
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // 기존 타임스탬프 가져오거나 빈 배열로 초기화
  const timestamps = rateLimitStore.get(ip) ?? [];

  // 윈도우 밖의 오래된 타임스탬프 정리
  const recentTimestamps = timestamps.filter((ts) => ts > windowStart);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    // 가장 오래된 타임스탬프를 기준으로 윈도우 리셋까지 남은 시간 계산
    const oldestTimestamp = recentTimestamps[0];
    const resetAt = oldestTimestamp + RATE_LIMIT_WINDOW_MS;
    const retryAfterMs = resetAt - now;
    const retryAfter = Math.ceil(retryAfterMs / 1000);

    return { allowed: false, retryAfter };
  }

  // 현재 요청 타임스탬프 추가
  recentTimestamps.push(now);
  rateLimitStore.set(ip, recentTimestamps);

  return { allowed: true };
}
