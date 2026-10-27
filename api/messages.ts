import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { head } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, getUserId } from "./_session.js";

const MAX_TEXT = 2000;
const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const sql = neon(process.env.DATABASE_URL as string);

function secret() {
  const key = Buffer.from(process.env.MESSAGE_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("Invalid message key.");
  return key;
}

function seal(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return { iv: iv.toString("base64"), body: body.toString("base64") };
}

function open(iv: string, body: string) {
  const key = secret();
  try {
    const raw = Buffer.from(body, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(raw.subarray(raw.length - 16));
    return Buffer.concat([decipher.update(raw.subarray(0, raw.length - 16)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function toId(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function verifyAttachment(raw: unknown, userId: number) {
  if (!raw || typeof raw !== "object") return null;
  const { url, name } = raw as { url?: unknown; name?: unknown };
  if (typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".blob.vercel-storage.com")) return null;
  try {
    const info = await head(url);
    if (!info.pathname.startsWith(`chat/${userId}/`)) return null;
    if (!ALLOWED_TYPES.has(info.contentType) || info.size > MAX_BYTES) return null;
    const label = typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : "file";
    return { url: info.url, type: info.contentType, name: label, size: info.size };
  } catch {
    return null;
  }
}

function packAttachment(r: Record<string, any>) {
  if (!r.attachmentUrl) return null;
  return {
    url: r.attachmentUrl as string,
    type: r.attachmentType as string,
    name: (r.attachmentName as string | null) ?? "file",
    size: Number(r.attachmentSize) || 0,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in." });
  }

  const action = String(req.query.action ?? "");

  try {
    if (action === "conversations" && req.method === "GET") {
      const me = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
      if (!me.length) {
        return res.status(401).json({ error: "Please sign in." });
      }
      if (me[0].is_admin !== true) {
        return res.status(403).json({ error: "Only admins can view conversations." });
      }
      const rows = await sql`
        SELECT DISTINCT ON (m.member_id)
          m.member_id AS "memberId",
          u.name, u.email, u.phone,
          m.id,
          m.sender_id AS "senderId",
          m.iv,
          m.body,
          m.attachment_type AS "attachmentType",
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
            text: open(r.iv, r.body),
            attachmentType: r.attachmentType as string | null,
            createdAt: r.createdAt,
          },
        }))
        .sort((a, b) => b.last.id - a.last.id);
      return res.status(200).json({ conversations });
    }

    if (action === "messages" && req.method === "GET") {
      const requested = toId(req.query.memberId);
      const after = Number(req.query.after) || 0;
      const rows = await sql`
        WITH me AS (
          SELECT id, is_admin FROM users WHERE id = ${userId}
        ),
        target AS (
          SELECT CASE WHEN is_admin THEN ${requested}::int ELSE id END AS id FROM me
        )
        SELECT m.id,
               m.sender_id AS "senderId",
               u.name AS "senderName",
               m.iv,
               m.body,
               m.attachment_url AS "attachmentUrl",
               m.attachment_type AS "attachmentType",
               m.attachment_name AS "attachmentName",
               m.attachment_size AS "attachmentSize",
               m.created_at AS "createdAt"
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.member_id = (SELECT id FROM target) AND m.id > ${after}
        ORDER BY m.id ASC
        LIMIT 200
      `;
      const messages = rows.map((r) => ({
        id: r.id,
        senderId: r.senderId,
        senderName: r.senderName,
        text: open(r.iv, r.body),
        attachment: packAttachment(r),
        createdAt: r.createdAt,
      }));
      return res.status(200).json({ messages });
    }

    if (action === "send" && req.method === "POST") {
      const { memberId: bodyMember, text, attachment: bodyAttachment } = req.body ?? {};
      const clean = typeof text === "string" ? text.trim() : "";
      const hasAttachment = bodyAttachment !== undefined && bodyAttachment !== null;
      const attachment = hasAttachment ? await verifyAttachment(bodyAttachment, userId) : null;
      if (hasAttachment && !attachment) {
        return res.status(400).json({ error: "Invalid attachment." });
      }
      if (clean.length > MAX_TEXT || (!clean && !attachment)) {
        return res.status(400).json({ error: "Invalid message." });
      }

      const requested = toId(bodyMember);
      const sealed = seal(clean);
      const rows = await sql`
        INSERT INTO messages (member_id, sender_id, iv, body, attachment_url, attachment_type, attachment_name, attachment_size)
        SELECT t.id, me.id, ${sealed.iv}::text, ${sealed.body}::text,
               ${attachment?.url ?? null}::text,
               ${attachment?.type ?? null}::text,
               ${attachment?.name ?? null}::text,
               ${attachment?.size ?? null}::int
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