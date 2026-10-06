import { useState } from "react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import { link } from "../navigate";
import { nextPath, signUp } from "../auth";

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

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const search = window.location.search;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await signUp(name, email, password);
    setLoading(false);
    if (!ok) {
      setError(data.error ?? "Could not create your account. Please try again.");
      return;
    }
    window.location.href = nextPath("/member");
  }

  function handleGoogle() {
    window.location.href = `/api/google/start?next=${encodeURIComponent(nextPath("/member"))}`;
  }

  const field =
    "w-full rounded-full border border-white/40 bg-white/10 px-6 py-4 text-lg font-semibold text-white placeholder:text-white/60 focus:border-sun focus:outline-none focus:ring-2 focus:ring-sun/60";

  return (
    <Layout>
      <section className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-12 sm:py-20">
        <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Create your account.
        </h1>
        <p className="mt-4 max-w-md text-center text-lg font-semibold leading-relaxed text-white/90 sm:text-xl">
          Join SmartArt254 to book activities and keep track of your upcoming sessions.
        </p>

        <div className="mt-10 w-full rounded-3xl border border-white/30 bg-white/10 p-6 shadow-xl backdrop-blur-sm sm:p-10">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-white/60 px-6 py-4 text-lg font-bold transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sun/60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <GoogleIcon />
            </span>
            Sign up with Google
          </button>

          <div className="my-7 flex items-center gap-4 text-base font-semibold text-white/70">
            <span className="h-px flex-1 bg-white/40" />
            or use your email
            <span className="h-px flex-1 bg-white/40" />
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-xl bg-pink px-4 py-3 font-semibold">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="sr-only" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              required
            />
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
              autoComplete="new-password"
              placeholder="Password (at least 8 characters)"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-full bg-sun px-6 py-4 text-lg font-bold text-purple-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:opacity-60"
            >
              {loading ? "Creating account" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-base font-semibold text-white/85">
            Already have an account?{" "}
            <a href={`/signin${search}`} onClick={link(`/signin${search}`)} className="text-sun hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </section>
    </Layout>
  );
}