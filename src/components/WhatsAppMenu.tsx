import { useEffect, useRef, useState } from "react";

const contacts = [
  { label: "0757 848 911", number: "254757848911" },
  { label: "0704 537 582", number: "254704537582" },
];

interface Props {
  label?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export default function WhatsAppMenu({
  label = "WhatsApp",
  buttonClassName = "",
  menuClassName = "left-0",
}: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClassName}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full z-20 mb-3 w-56 rounded-2xl border border-ink/15 bg-white p-2 text-left shadow-xl ${menuClassName}`}
        >
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-widest text-ink/60">Chat with us on</p>
          {contacts.map((c) => (
            <a
              key={c.number}
              role="menuitem"
              href={`https://wa.me/${c.number}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-base font-bold text-ink hover:bg-pink-soft hover:text-pink"
            >
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}