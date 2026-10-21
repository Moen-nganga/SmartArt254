export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
}

export interface Credentials {
  email?: string;
  phone?: string;
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
  return ok && data.user ? data.user : null;
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  if (!/^\+?[\d\s\-().]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function signIn(credentials: Credentials, password: string) {
  return call("signin", { ...credentials, password });
}

export function signUp(name: string, credentials: Credentials, password: string) {
  return call("signup", { name, ...credentials, password });
}

export async function signOut() {
  await call("signout", {});
}

export function nextPath(fallback = "/") {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}