import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_session";

const statuses = ["pending", "waiting_confirmation", "confirmed"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in." });
  }

  const sql = neon(process.env.DATABASE_URL as string);

  try {
    if (req.method === "POST") {
      const { name, email, phone, activity, eventType, eventDate, guests, message } = req.body ?? {};

      if (!name || !email || !phone || !activity || !eventDate || !guests) {
        return res.status(400).json({ error: "Please fill in all required fields." });
      }

      await sql`
        INSERT INTO bookings (user_id, name, email, phone, activity, event_type, event_date, guests, message)
        VALUES (${userId}, ${name}, ${email}, ${phone}, ${activity}, ${eventType ?? null}, ${eventDate}, ${Number(guests)}, ${message ?? null})
      `;
      return res.status(201).json({ ok: true });
    }

    const admins = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
    if (!admins.length || !admins[0].is_admin) {
      return res.status(403).json({ error: "Only admins can view bookings." });
    }

    if (req.method === "GET") {
      const bookings = await sql`
        SELECT id, name, email, phone, activity,
               event_type AS "eventType",
               to_char(event_date, 'YYYY-MM-DD') AS "eventDate",
               guests, message, status,
               created_at AS "createdAt"
        FROM bookings
        ORDER BY created_at DESC
      `;
      return res.status(200).json({ bookings });
    }

    if (req.method === "PATCH") {
      const { id, status } = req.body ?? {};
      if (!statuses.includes(status) || !Number(id)) {
        return res.status(400).json({ error: "Invalid booking or status." });
      }
      const rows = await sql`UPDATE bookings SET status = ${status} WHERE id = ${Number(id)} RETURNING id, status`;
      if (!rows.length) return res.status(404).json({ error: "Booking not found." });
      return res.status(200).json({ booking: rows[0] });
    }

    if (req.method === "DELETE") {
      const id = Number(req.query.id);
      if (!id) return res.status(400).json({ error: "Invalid booking." });
      const rows = await sql`DELETE FROM bookings WHERE id = ${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: "Booking not found." });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}