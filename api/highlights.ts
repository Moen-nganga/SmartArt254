import { neon } from "@neondatabase/serverless";
import { del, head } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, getUserId } from "./_session.js";

const MAX_CAPTION = 140;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ACTIVE = 10;

const sql = neon(process.env.DATABASE_URL as string);

async function removeExpired() {
  const rows = await sql`DELETE FROM highlights WHERE created_at <= NOW() - INTERVAL '24 hours' RETURNING url`;
  if (!rows.length) return;
  try {
    await del(rows.map((r) => r.url as string));
  } catch {
    return;
  }
}

async function verifyPicture(raw: unknown, userId: number) {
  if (typeof raw !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com")) return null;
  try {
    const info = await head(raw);
    if (!info.pathname.startsWith(`highlights/${userId}/`)) return null;
    if (!info.contentType.startsWith("image/") || info.size > MAX_BYTES) return null;
    return info.url;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in." });
  }

  try {
    if (req.method === "GET") {
      await removeExpired();
      const highlights = await sql`
        SELECT h.id, h.url, h.caption, h.created_at AS "createdAt", h.user_id AS "userId",
               split_part(u.name, ' ', 1) AS name
        FROM highlights h
        JOIN users u ON u.id = h.user_id
        WHERE h.created_at > NOW() - INTERVAL '24 hours'
        ORDER BY h.created_at DESC
        LIMIT 200
      `;
      return res.status(200).json({ highlights });
    }

    if (req.method === "POST") {
      const { url, caption } = req.body ?? {};
      const picture = await verifyPicture(url, userId);
      if (!picture) return res.status(400).json({ error: "Invalid picture." });

      const active = await sql`
        SELECT COUNT(*)::int AS total FROM highlights
        WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '24 hours'
      `;
      if (active[0].total >= MAX_ACTIVE) {
        try {
          await del(picture);
        } catch {
          return res.status(400).json({ error: "You can have up to 10 highlights at a time." });
        }
        return res.status(400).json({ error: "You can have up to 10 highlights at a time." });
      }

      const cleanCaption = typeof caption === "string" ? caption.trim().slice(0, MAX_CAPTION) : "";
      const rows = await sql`
        INSERT INTO highlights (user_id, url, caption)
        VALUES (${userId}, ${picture}, ${cleanCaption || null})
        RETURNING id
      `;
      return res.status(201).json({ id: rows[0].id });
    }

    if (req.method === "DELETE") {
      const id = Number(req.query.id);
      if (!id) return res.status(400).json({ error: "Invalid highlight." });
      const rows = await sql`
        DELETE FROM highlights
        WHERE id = ${id}
          AND (user_id = ${userId} OR EXISTS (SELECT 1 FROM users WHERE id = ${userId} AND is_admin = TRUE))
        RETURNING url
      `;
      if (!rows.length) return res.status(404).json({ error: "Highlight not found." });
      try {
        await del(rows[0].url as string);
      } catch {
        return res.status(200).json({ ok: true });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}