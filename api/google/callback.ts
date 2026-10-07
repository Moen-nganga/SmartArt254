import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeCookie } from "../_session.js";

const clearState = "g_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";

function readCookie(req: VercelRequest, name: string) {
  const found = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const fail = () => {
    res.setHeader("Set-Cookie", clearState);
    return res.redirect(302, "/signin?error=google");
  };

  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    const stored = readCookie(req, "g_state");
    if (!code || !state || !stored) return fail();

    const [savedState, encodedNext] = stored.split(".");
    if (savedState !== state) return fail();

    const decodedNext = Buffer.from(encodedNext ?? "", "base64url").toString();
    const next = decodedNext.startsWith("/") && !decodedNext.startsWith("//") ? decodedNext : "/";

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail();

    const tokens = await tokenRes.json();
    const idToken = String(tokens.id_token ?? "");
    const part = idToken.split(".")[1];
    if (!part) return fail();

    const profile = JSON.parse(Buffer.from(part, "base64url").toString());
    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || !profile.email_verified || !profile.sub || !profile.email) {
      return fail();
    }

    const googleId = String(profile.sub);
    const email = String(profile.email).trim().toLowerCase();
    const name = String(profile.name ?? "").trim() || email.split("@")[0];

    const sql = neon(process.env.DATABASE_URL as string);
    let userId: number;

    const byGoogle = await sql`SELECT id FROM users WHERE google_id = ${googleId}`;
    if (byGoogle.length) {
      userId = byGoogle[0].id;
    } else {
      const byEmail = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (byEmail.length) {
        userId = byEmail[0].id;
        await sql`UPDATE users SET google_id = ${googleId} WHERE id = ${userId}`;
      } else {
        const created = await sql`
          INSERT INTO users (name, email, google_id)
          VALUES (${name}, ${email}, ${googleId})
          RETURNING id
        `;
        userId = created[0].id;
      }
    }

    res.setHeader("Set-Cookie", [makeCookie(userId), clearState]);
    return res.redirect(302, next);
  } catch {
    return fail();
  }
}