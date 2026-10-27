import { createHmac, timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_AGE = 60 * 60 * 24 * 30;

const ALLOWED_ORIGINS = new Set(["https://localhost", "capacitor://localhost", "http://localhost"]);

function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET as string).update(value).digest("hex");
}

export function makeToken(userId: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function makeCookie(userId: number) {
  return `session=${makeToken(userId)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`;
}

export const clearCookie = "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";

export function verifyToken(token: string): number | null {
  const [id, exp, sig] = token.split(".");
  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(sig ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return Number(id);
}

function readToken(req: VercelRequest): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const raw = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session="));
  if (!raw) return null;
  return raw.slice("session=".length);
}

export function getUserId(req: VercelRequest): number | null {
  const token = readToken(req);
  return token ? verifyToken(token) : null;
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}