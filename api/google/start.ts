import { randomBytes } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const rawNext = String(req.query.next ?? "/");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const state = randomBytes(16).toString("hex");
  const cookieValue = `${state}.${Buffer.from(next).toString("base64url")}`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  res.setHeader("Set-Cookie", `g_state=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}