import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, activity, eventDate, guests, message } = req.body ?? {};

  if (!name || !email || !phone || !activity || !eventDate || !guests) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  try {
    const sql = neon(process.env.DATABASE_URL as string);
    await sql`
      INSERT INTO bookings (name, email, phone, activity, event_date, guests, message)
      VALUES (${name}, ${email}, ${phone}, ${activity}, ${eventDate}, ${Number(guests)}, ${message ?? null})
    `;
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Could not save your booking. Please try again." });
  }
}