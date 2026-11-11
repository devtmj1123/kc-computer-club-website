import { NextResponse } from 'next/server';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

/**
 * Best-effort in-memory rate limiting. Serverless instances each keep their own
 * bucket, so this is a speed bump rather than a hard guarantee. It is paired
 * with captcha, moderation and server-side identity checks.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
      if (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) buckets.delete(oldestKey);
      }
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { success: false, error: '尝试过于频繁，请稍后再试' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  );
}
