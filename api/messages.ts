import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_session.js";

const MAX_CIPHERTEXT = 20000;
const KEY_PATTERN = /^[A-Za-z0-9+/]{87}=$/;
const IV_PATTERN = /^[A-Za-z0-9+/]{16}$/;

const sql = neon(process.env.DATABASE_URL as string);

function validWrapped(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length || entries.length > 200) return false;
  return entries.every(([id, entry]) => {
    const item = entry as { iv?: unknown; key?: unknown };
    return (
      /^\d+$/.test(id) &&
      typeof item?.iv === "string" &&
      IV_PATTERN.test(item.iv) &&
      typeof item.key === "string" &&
      item.key.length > 0 &&
      item.key.length < 200
    );
  });
}

function toId(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in." });
  }

  const action = String(req.query.action ?? "");

  try {
    if (action === "key" && req.method === "POST") {
      const { publicKey } = req.body ?? {};
      if (typeof publicKey !== "string" || !KEY_PATTERN.test(publicKey)) {
        return res.status(400).json({ error: "Invalid key." });
      }
      const rows = await sql`
        INSERT INTO user_keys (user_id, public_key)
        SELECT id, ${publicKey}::text FROM users WHERE id = ${userId}
        ON CONFLICT (user_id) DO UPDATE SET public_key = EXCLUDED.public_key, updated_at = NOW()
        RETURNING user_id
      `;
      if (!rows.length) {
        return res.status(401).json({ error: "Please sign in." });
      }
      return res.status(200).json({ ok: true });
    }

    if (action === "keys" && req.method === "GET") {
      const requested = toId(req.query.memberId);
      const keys = await sql`
        WITH me AS (
          SELECT id, is_admin FROM users WHERE id = ${userId}
        ),
        target AS (
          SELECT CASE WHEN is_admin THEN ${requested}::int ELSE id END AS id FROM me
        )
        SELECT k.user_id AS "userId", k.public_key AS "publicKey"
        FROM user_keys k
        JOIN users u ON u.id = k.user_id
        WHERE k.user_id = (SELECT id FROM target) OR u.is_admin = TRUE
      `;
      return res.status(200).json({ keys });
    }

    if (action === "conversations" && req.method === "GET") {
      const me = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
      if (!me.length) {
        return res.status(401).json({ error: "Please sign in." });
      }
      if (me[0].is_admin !== true) {
        return res.status(403).json({ error: "Only admins can view conversations." });
      }
      const mine = String(userId);
      const rows = await sql`
        SELECT DISTINCT ON (m.member_id)
          m.member_id AS "memberId",
          u.name, u.email, u.phone,
          m.id,
          m.sender_id AS "senderId",
          m.sender_key AS "senderKey",
          m.iv,
          m.ciphertext,
          m.wrapped -> ${mine}::text AS wrapped,
          m.created_at AS "createdAt"
        FROM messages m
        JOIN users u ON u.id = m.member_id
        ORDER BY m.member_id, m.id DESC
      `;
      const conversations = rows
        .map((r) => ({
          memberId: r.memberId,
          name: r.name,
          email: r.email,
          phone: r.phone,
          last: {
            id: r.id,
            senderId: r.senderId,
            senderKey: r.senderKey,
            iv: r.iv,
            ciphertext: r.ciphertext,
            wrapped: r.wrapped,
            createdAt: r.createdAt,
          },
        }))
        .sort((a, b) => b.last.id - a.last.id);
      return res.status(200).json({ conversations });
    }

    if (action === "messages" && req.method === "GET") {
      const requested = toId(req.query.memberId);
      const after = Number(req.query.after) || 0;
      const mine = String(userId);
      const messages = await sql`
        WITH me AS (
          SELECT id, is_admin FROM users WHERE id = ${userId}
        ),
        target AS (
          SELECT CASE WHEN is_admin THEN ${requested}::int ELSE id END AS id FROM me
        )
        SELECT m.id,
               m.sender_id AS "senderId",
               u.name AS "senderName",
               m.sender_key AS "senderKey",
               m.iv,
               m.ciphertext,
               m.wrapped -> ${mine}::text AS wrapped,
               m.created_at AS "createdAt"
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.member_id = (SELECT id FROM target) AND m.id > ${after}
        ORDER BY m.id ASC
        LIMIT 200
      `;
      return res.status(200).json({ messages });
    }

    if (action === "send" && req.method === "POST") {
      const { memberId: bodyMember, iv, ciphertext, senderKey, wrapped } = req.body ?? {};

      if (
        typeof iv !== "string" ||
        !IV_PATTERN.test(iv) ||
        typeof ciphertext !== "string" ||
        !ciphertext ||
        ciphertext.length > MAX_CIPHERTEXT ||
        typeof senderKey !== "string" ||
        !KEY_PATTERN.test(senderKey) ||
        !validWrapped(wrapped)
      ) {
        return res.status(400).json({ error: "Invalid message." });
      }

      const requested = toId(bodyMember);
      const rows = await sql`
        INSERT INTO messages (member_id, sender_id, sender_key, iv, ciphertext, wrapped)
        SELECT t.id, me.id, ${senderKey}::text, ${iv}::text, ${ciphertext}::text, ${JSON.stringify(wrapped)}::jsonb
        FROM users me
        JOIN users t ON t.id = CASE WHEN me.is_admin THEN ${requested}::int ELSE me.id END
        WHERE me.id = ${userId}
        RETURNING id
      `;
      if (!rows.length) {
        return res.status(404).json({ error: "User not found." });
      }
      return res.status(201).json({ id: rows[0].id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}