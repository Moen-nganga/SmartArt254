import type { NeonQueryFunction } from "@neondatabase/serverless";
import { createHash } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Sql = NeonQueryFunction<false, false>;

export interface LimitResult {
  allowed: boolean;
  retryAfter: number;
}

export function clientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const fromForwarded = first?.split(",")[0]?.trim();
  const realIp = req.headers["x-real-ip"];
  return fromForwarded || (Array.isArray(realIp) ? realIp[0] : realIp) || req.socket?.remoteAddress || "unknown";
}

export function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hit(sql: Sql, key: string, limit: number, windowSeconds: number): Promise<LimitResult> {
  const rows = (await sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN now() ELSE rate_limits.window_start END
    RETURNING
      count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_start + make_interval(secs => ${windowSeconds}::double precision) - now()))))::int AS retry_after
  `) as { count: number; retry_after: number }[];

  if (Math.random() < 0.01) {
    await sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`;
  }

  const row = rows[0];
  return { allowed: Number(row.count) <= limit, retryAfter: Number(row.retry_after) };
}

export async function resetLimit(sql: Sql, key: string) {
  await sql`DELETE FROM rate_limits WHERE key = ${key}`;
}

export function tooMany(res: VercelResponse, retryAfter: number) {
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  res.setHeader("Retry-After", String(retryAfter));
  return res.status(429).json({
    error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  });
}