import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_session.js";

const PREFIX = "data:image/jpeg;base64,";

function cleanImages(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((v): v is string => typeof v === "string" && v.startsWith(PREFIX))
    .map((v) => v.slice(PREFIX.length))
    .filter((v) => v.length < 1_500_000)
    .slice(0, 4);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL as string);

  try {
    if (req.method === "GET") {
      if (req.query.image !== undefined) {
        const imageId = Number(req.query.image);
        if (!imageId) return res.status(400).json({ error: "Invalid image." });
        const rows = await sql`SELECT data FROM blog_images WHERE id = ${imageId}`;
        if (!rows.length) return res.status(404).json({ error: "Image not found." });
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.status(200).send(Buffer.from(rows[0].data, "base64"));
      }

      const posts = await sql`
        SELECT p.id, p.title, p.body, p.created_at AS "createdAt",
               COALESCE((SELECT json_agg(i.id ORDER BY i.id) FROM blog_images i WHERE i.post_id = p.id), '[]'::json) AS "imageIds"
        FROM blog_posts p
        ORDER BY p.created_at DESC
      `;
      return res.status(200).json({ posts });
    }

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Please sign in." });
    const admins = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
    if (!admins.length || !admins[0].is_admin) {
      return res.status(403).json({ error: "Only admins can change the blog." });
    }

    if (req.method === "POST") {
      const { title, body, images } = req.body ?? {};
      const cleanTitle = String(title ?? "").trim();
      const cleanBody = String(body ?? "").trim();
      if (!cleanTitle || !cleanBody) return res.status(400).json({ error: "Add a title and some text." });
      const rows = await sql`
        INSERT INTO blog_posts (title, body, author_id)
        VALUES (${cleanTitle}, ${cleanBody}, ${userId})
        RETURNING id
      `;
      for (const data of cleanImages(images)) {
        await sql`INSERT INTO blog_images (post_id, data) VALUES (${rows[0].id}, ${data})`;
      }
      return res.status(201).json({ id: rows[0].id });
    }

    if (req.method === "PATCH") {
      const { id, title, body, addImages, removeImageIds } = req.body ?? {};
      const postId = Number(id);
      const cleanTitle = String(title ?? "").trim();
      const cleanBody = String(body ?? "").trim();
      if (!postId || !cleanTitle || !cleanBody) return res.status(400).json({ error: "Add a title and some text." });
      const updated = await sql`
        UPDATE blog_posts SET title = ${cleanTitle}, body = ${cleanBody}, updated_at = NOW()
        WHERE id = ${postId}
        RETURNING id
      `;
      if (!updated.length) return res.status(404).json({ error: "Post not found." });
      const removals = Array.isArray(removeImageIds) ? removeImageIds.map(Number).filter(Boolean) : [];
      for (const imageId of removals) {
        await sql`DELETE FROM blog_images WHERE id = ${imageId} AND post_id = ${postId}`;
      }
      for (const data of cleanImages(addImages)) {
        await sql`INSERT INTO blog_images (post_id, data) VALUES (${postId}, ${data})`;
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const postId = Number(req.query.id);
      if (!postId) return res.status(400).json({ error: "Invalid post." });
      const rows = await sql`DELETE FROM blog_posts WHERE id = ${postId} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: "Post not found." });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}