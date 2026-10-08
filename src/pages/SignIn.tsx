import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import { link } from "../navigate";
import { nextPath, signIn } from "../auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const search = window.location.search;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "google") {
      setError("Google sign in did not work. Please try again or use your email.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await signIn(email, password);
    setLoading(false);
    if (!ok) {
      setError(data.error ?? "Could not sign in. Please try again.");
      return;
    }
    window.location.href = nextPath("/member");
  }

  function handleGoogle() {
    window.location.href = `/api/google/start?next=${encodeURIComponent(nextPath("/member"))}`;
  }

  const field =
    "w-full rounded-full border-2 border-ink/20 bg-white px-6 py-4 text-lg font-semibold text-ink placeholder:text-ink/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

  return (
    <Layout>
      <section className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-12 sm:py-20">
        <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Welcome back.
        </h1>
        <p className="mt-4 max-w-md text-center text-lg font-semibold leading-relaxed text-ink/80 sm:text-xl">
          Sign in to book activities and keep track of your upcoming sessions.
        </p>

        <div className="mt-10 w-full rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-10">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-ink/20 bg-white px-6 py-4 text-lg font-bold text-ink transition hover:bg-mist focus:outline-none focus:ring-2 focus:ring-royal/40"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-4 text-base font-semibold text-ink/60">
            <span className="h-px flex-1 bg-ink/20" />
            or use your email
            <span className="h-px flex-1 bg-ink/20" />
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              required
            />
            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-full bg-sun px-6 py-4 text-lg font-bold text-ink transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-royal/60 disabled:opacity-60"
            >
              {loading ? "Signing in" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-base font-semibold text-ink/80">
            <span>
              New here?{" "}
              <a href={`/signup${search}`} onClick={link(`/signup${search}`)} className="text-royal hover:underline">
                Create an account
              </a>
            </span>
          </div>
        </div>
      </section>
    </Layout>
  );
}