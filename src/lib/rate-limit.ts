import { TooManyRequestsError } from "@/lib/errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function buildRateLimitKey(scope: string, req: Request, extra?: string) {
  const ip = getClientIp(req);
  return extra ? `${scope}:${extra}:${ip}` : `${scope}:${ip}`;
}

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new TooManyRequestsError();
  }
}
