import { link } from "../navigate";
import { isNative } from "../native";
import WhatsAppMenu from "./WhatsAppMenu";

const items = [
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
  { label: "Blog", path: "/blog" },
  { label: "Jobs", path: "/jobs" },
];

const phones = [
  { display: "0757 848 911", tel: "+254757848911" },
  { display: "0704 537 582", tel: "+254704537582" },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-ink/15">
      {isNative ? null : (
        <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-10">
          <div className="flex flex-col items-start gap-4 rounded-3xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-2xl font-extrabold sm:text-3xl">Get the SmartArt254 app</p>
              <p className="mt-1 text-base text-white/80">Free for Android. Tap the button and open the file once it downloads.</p>
            </div>
            <a
              href="/downloads/SmartArt254.apk"
              download="SmartArt254.apk"
              className="inline-flex items-center gap-3 rounded-full bg-sun px-8 py-4 text-lg font-bold text-ink shadow-lg transition hover:scale-105 sm:text-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download SmartArt254 APK
            </a>
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <a href="/" onClick={link("/")} className="text-2xl font-extrabold">
            Smart<span className="text-pink">Art</span>254
          </a>
          <p className="mt-1 text-sm text-ink/70">Hands-on art across Kenya.</p>
          <p className="mt-1 text-sm text-ink/70">
            Call or WhatsApp{" "}
            {phones.map((p, i) => (
              <span key={p.tel}>
                {i > 0 ? " or " : ""}
                <a href={`tel:${p.tel}`} className="font-semibold hover:text-pink">
                  {p.display}
                </a>
              </span>
            ))}
          </p>
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