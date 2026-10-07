import { link } from "../navigate";
import WhatsAppMenu from "./WhatsAppMenu";

const items = [
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
  { label: "Blog", path: "/blog" },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-ink/15">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <a href="/" onClick={link("/")} className="text-2xl font-extrabold">
            Smart<span className="text-pink">Art</span>254
          </a>
          <p className="mt-1 text-sm text-ink/70">Hands-on art across Kenya.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-2 text-base font-semibold">
          {items.map((item) => (
            <a key={item.path} href={item.path} onClick={link(item.path)} className="hover:text-pink">
              {item.label}
            </a>
          ))}
          <WhatsAppMenu buttonClassName="hover:text-pink" menuClassName="left-0 sm:left-auto sm:right-0" />
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-sm text-ink/60 sm:px-10">
        © {new Date().getFullYear()} SmartArt254. All rights reserved.
      </p>
    </footer>
  );
}