export interface User {
  id: number;
  name: string;
  email: string;
}

async function call(action: string, body?: object) {
  try {
    const res = await fetch(`/api/auth?action=${action}`, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Could not reach the server. Check your connection." } };
  }
}

export async function getUser(): Promise<User | null> {
  const { ok, data } = await call("me");
  return ok ? data.user : null;
}

export function signIn(email: string, password: string) {
  return call("signin", { email, password });
}

export function signUp(name: string, email: string, password: string) {
  return call("signup", { name, email, password });
}

export async function signOut() {
  await call("signout", {});
}

export function nextPath(fallback = "/") {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}