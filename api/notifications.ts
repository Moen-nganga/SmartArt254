import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, getUserId } from "./_session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in." });
  }

  const sql = neon(process.env.DATABASE_URL as string);

  try {
    if (req.method === "GET") {
      const seen = await sql`SELECT notifications_seen_at AS "seenAt" FROM users WHERE id = ${userId}`;
      if (!seen.length) return res.status(404).json({ error: "User not found." });

      const items = await sql`
        SELECT type, id, title, detail, created_at
        FROM (
          SELECT 'blog' AS type, id, title, LEFT(body, 140) AS detail, created_at
          FROM blog_posts
          UNION ALL
          SELECT 'highlight' AS type, id, NULL::text AS title, caption AS detail, created_at
          FROM highlights
        ) n
        ORDER BY created_at DESC
        LIMIT 30
      `;
      return res.status(200).json({ items, seenAt: seen[0].seenAt });
    }

    if (req.method === "POST") {
      const rows = await sql`
        UPDATE users SET notifications_seen_at = NOW()
        WHERE id = ${userId}
        RETURNING notifications_seen_at AS "seenAt"
      `;
      if (!rows.length) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({ seenAt: rows[0].seenAt });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}