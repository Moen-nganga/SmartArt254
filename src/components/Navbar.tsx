import { useEffect, useState } from "react";
import { link } from "../navigate";
import { getUser } from "../auth";
import type { User } from "../auth";

const items = [
  { label: "Home", path: "/" },
  { label: "Schools", path: "/schools" },
  { label: "Workshops", path: "/workshops" },
  { label: "Events", path: "/events" },
  { label: "Blog", path: "/blog" },
  { label: "Book", path: "/book" },
];

export default function Navbar() {
  const current = window.location.pathname.replace(/\/$/, "") || "/";
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const accountPath = user ? "/member" : "/signin";

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-ink/15 px-5 py-5 sm:px-10 sm:py-7">
      <a href="/" onClick={link("/")} className="text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">
        Smart<span className="text-pink">Art</span>254
      </a>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-5 text-lg font-semibold sm:gap-10 sm:text-2xl">
        {items.map((item) => (
          <a
            key={item.path}
            href={item.path}
            onClick={link(item.path)}
            aria-current={current === item.path ? "page" : undefined}
            className={current === item.path ? "text-pink" : "hover:text-pink"}
          >
            {item.label}
          </a>
        ))}
        <a
          href={accountPath}
          onClick={link(accountPath)}
          aria-current={current === accountPath ? "page" : undefined}
          className={`rounded-full bg-sun px-5 py-2 text-base font-bold text-ink transition hover:brightness-105 sm:text-xl ${
            user === undefined ? "invisible" : ""
          }`}
        >
          {user ? "My account" : "Sign in"}
        </a>
      </nav>
    </header>
  );
}