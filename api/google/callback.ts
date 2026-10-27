import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeCookie, makeToken } from "../_session.js";

const APP_SCHEME = "com.smartart254.app";
const clearState = "g_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";

function readCookie(req: VercelRequest, name: string) {
  const found = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

function backToApp(res: VercelResponse, query: string) {
  const url = `${APP_SCHEME}://auth?${query}`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Returning to SmartArt254</title></head><body style="font-family:sans-serif;text-align:center;padding:48px 24px"><p>Returning to the app...</p><p><a href="${url}" style="display:inline-block;padding:14px 28px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Open SmartArt254</a></p><script>window.location.href=${JSON.stringify(url)};</script></body></html>`
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let fromApp = false;

  const fail = () => {
    res.setHeader("Set-Cookie", clearState);
    if (fromApp) return backToApp(res, "error=google");
    return res.redirect(302, "/signin?error=google");
  };

  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    const stored = readCookie(req, "g_state");
    if (!code || !state || !stored) return fail();

    const [savedState, encodedNext, mode] = stored.split(".");
    fromApp = mode === "app";
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

    if (fromApp) {
      res.setHeader("Set-Cookie", clearState);
      return backToApp(res, `token=${encodeURIComponent(makeToken(userId))}`);
    }

    res.setHeader("Set-Cookie", [makeCookie(userId), clearState]);
    return res.redirect(302, next);
  } catch {
    return fail();
  }
}