import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const API_BASE = "https://smartart254-seven.vercel.app/";
const APP_SCHEME = "com.smartart254.app";
const TOKEN_KEY = "smartart254_token";
const NEXT_KEY = "smartart254_next";

export const isNative = Capacitor.isNativePlatform();

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
}

export function apiUrl(path: string) {
  return isNative && path.startsWith("/") ? `${API_BASE}${path}` : path;
}

export function startGoogleSignIn(next: string) {
  try {
    localStorage.setItem(NEXT_KEY, next);
  } catch {
    return;
  }
  Browser.open({ url: `${API_BASE}/api/google/start?app=1` });
}

if (isNative) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") {
      const isApiPath = input.startsWith("/api/");
      if (isApiPath || input.startsWith(`${API_BASE}/api/`)) {
        const headers = new Headers(init?.headers);
        const token = getToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return originalFetch(isApiPath ? `${API_BASE}${input}` : input, { ...init, headers });
      }
    }
    return originalFetch(input, init);
  };

  App.addListener("appUrlOpen", ({ url }) => {
    if (!url.startsWith(`${APP_SCHEME}://auth`)) return;
    Browser.close().catch(() => {});
    const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
    const token = new URLSearchParams(query).get("token");
    let next = "/member";
    try {
      next = localStorage.getItem(NEXT_KEY) || "/member";
      localStorage.removeItem(NEXT_KEY);
    } catch {
      next = "/member";
    }
    if (token) {
      setToken(token);
      window.location.href = next;
    } else {
      window.location.href = "/signin?error=google";
    }
  });
}