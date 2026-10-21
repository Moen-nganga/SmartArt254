import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCookie, getUserId, makeCookie } from "./_session.js";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function checkPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function normalizePhone(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!/^\+?[\d\s\-().]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  let national = digits;
  if (!raw.startsWith("+")) {
    if (digits.startsWith("00")) national = digits.slice(2);
    else if (digits.startsWith("0") && digits.length === 10) national = `254${digits.slice(1)}`;
  }
  if (national.length < 10 || national.length > 15) return null;
  return `+${national}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;
  const sql = neon(process.env.DATABASE_URL as string);

  try {
    if (action === "me") {
      const id = getUserId(req);
      if (!id) return res.status(401).json({ error: "Not signed in" });
      const rows = await sql`SELECT id, name, email, phone, is_admin AS "isAdmin" FROM users WHERE id = ${id}`;
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

    const { name, email, phone, password } = req.body ?? {};
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const phoneGiven = String(phone ?? "").trim() !== "";
    const cleanPhone = phoneGiven ? normalizePhone(phone) : null;

    if (action === "signup") {
      const cleanName = String(name ?? "").trim();
      if (!cleanName || String(password ?? "").length < 8) {
        return res.status(400).json({ error: "Enter your name and a password of at least 8 characters." });
      }

      if (phoneGiven) {
        if (!cleanPhone) {
          return res.status(400).json({ error: "Enter a valid phone number with at least 10 digits." });
        }
        const existing = await sql`SELECT id FROM users WHERE phone = ${cleanPhone}`;
        if (existing.length) return res.status(409).json({ error: "An account with this phone number already exists." });
        const rows = await sql`
          INSERT INTO users (name, phone, password_hash)
          VALUES (${cleanName}, ${cleanPhone}, ${hashPassword(String(password))})
          RETURNING id, name, email, phone
        `;
        res.setHeader("Set-Cookie", makeCookie(rows[0].id));
        return res.status(201).json({ user: rows[0] });
      }

      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        return res.status(400).json({ error: "Enter a valid email address." });
      }
      const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
      if (existing.length) return res.status(409).json({ error: "An account with this email already exists." });
      const rows = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${cleanName}, ${cleanEmail}, ${hashPassword(String(password))})
        RETURNING id, name, email, phone
      `;
      res.setHeader("Set-Cookie", makeCookie(rows[0].id));
      return res.status(201).json({ user: rows[0] });
    }

    if (action === "signin") {
      if (phoneGiven && !cleanPhone) {
        return res.status(400).json({ error: "Enter a valid phone number with at least 10 digits." });
      }
      const rows = phoneGiven
        ? await sql`SELECT id, name, email, phone, password_hash FROM users WHERE phone = ${cleanPhone}`
        : await sql`SELECT id, name, email, phone, password_hash FROM users WHERE email = ${cleanEmail}`;
      if (!rows.length || !checkPassword(String(password ?? ""), rows[0].password_hash)) {
        return res.status(401).json({ error: "Incorrect details or password." });
      }
      res.setHeader("Set-Cookie", makeCookie(rows[0].id));
      return res.status(200).json({
        user: { id: rows[0].id, name: rows[0].name, email: rows[0].email, phone: rows[0].phone },
      });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return res.status(409).json({ error: "An account with these details already exists." });
    }
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}