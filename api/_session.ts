import { createHmac, timingSafeEqual } from "crypto";
import type { VercelRequest } from "@vercel/node";

const MAX_AGE = 60 * 60 * 24 * 30;

function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET as string).update(value).digest("hex");
}

export function makeCookie(userId: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  return `session=${payload}.${sign(payload)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`;
}

export const clearCookie = "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";

export function getUserId(req: VercelRequest): number | null {
  const raw = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session="));
  if (!raw) return null;

  const [id, exp, sig] = raw.slice("session=".length).split(".");
  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(sig ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return Number(id);
}