import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Please sign in to book." });
  }

  const { name, email, phone, activity, eventDate, guests, message } = req.body ?? {};

  if (!name || !email || !phone || !activity || !eventDate || !guests) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  try {
    const sql = neon(process.env.DATABASE_URL as string);
    await sql`
      INSERT INTO bookings (user_id, name, email, phone, activity, event_date, guests, message)
      VALUES (${userId}, ${name}, ${email}, ${phone}, ${activity}, ${eventDate}, ${Number(guests)}, ${message ?? null})
    `;
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Could not save your booking. Please try again." });
  }
}