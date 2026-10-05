import { link } from "../navigate";

const items = [
  { label: "Home", path: "/" },
  { label: "Schools", path: "/schools" },
  { label: "Workshops", path: "/workshops" },
  { label: "Events", path: "/events" },
  { label: "Book", path: "/book" },
];

export default function Navbar() {
  const current = window.location.pathname.replace(/\/$/, "") || "/";

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-5 sm:px-10 sm:py-7">
      <a href="/" onClick={link("/")} className="text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">
        Smart<span className="text-pink">Art</span>254
      </a>
      <nav aria-label="Main" className="flex items-center gap-5 text-lg font-semibold sm:gap-10 sm:text-2xl">
        {items.map((item) => (
          <a
            key={item.path}
            href={item.path}
            onClick={link(item.path)}
            aria-current={current === item.path ? "page" : undefined}
            className={current === item.path ? "text-sun" : "hover:text-sun"}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}