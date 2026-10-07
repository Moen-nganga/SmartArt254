import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCookie, getUserId, makeCookie } from "./_session.js";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function checkPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;
  const sql = neon(process.env.DATABASE_URL as string);

  try {
    if (action === "me") {
      const id = getUserId(req);
      if (!id) return res.status(401).json({ error: "Not signed in" });
      const rows = await sql`SELECT id, name, email, is_admin AS "isAdmin" FROM users WHERE id = ${id}`;
      if (!rows.length) return res.status(401).json({ error: "Not signed in" });
      return res.status(200).json({ user: rows[0] });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (action === "signout") {
      res.setHeader("Set-Cookie", clearCookie);
      return res.status(200).json({ ok: true });
    }

    const { name, email, password } = req.body ?? {};
    const cleanEmail = String(email ?? "").trim().toLowerCase();

    if (action === "signup") {
      const cleanName = String(name ?? "").trim();
      if (!cleanName || !/^\S+@\S+\.\S+$/.test(cleanEmail) || String(password ?? "").length < 8) {
        return res.status(400).json({ error: "Enter your name, a valid email and a password of at least 8 characters." });
      }
      const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
      if (existing.length) return res.status(409).json({ error: "An account with this email already exists." });
      const rows = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${cleanName}, ${cleanEmail}, ${hashPassword(String(password))})
        RETURNING id, name, email
      `;
      res.setHeader("Set-Cookie", makeCookie(rows[0].id));
      return res.status(201).json({ user: rows[0] });
    }

    if (action === "signin") {
      const rows = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${cleanEmail}`;
      if (!rows.length || !checkPassword(String(password ?? ""), rows[0].password_hash)) {
        return res.status(401).json({ error: "Incorrect email or password." });
      }
      res.setHeader("Set-Cookie", makeCookie(rows[0].id));
      return res.status(200).json({ user: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}