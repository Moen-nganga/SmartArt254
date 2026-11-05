import { useCallback, useEffect, useRef, useState } from "react";

interface NotificationItem {
  type: "blog" | "highlight";
  id: number;
  title: string | null;
  detail: string | null;
  created_at: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  seenAt: string;
}

const PANEL_MAX = 416;
const EDGE_GAP = 12;

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [freshKeys, setFreshKeys] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setItems(data.items);
      setSeenAt(data.seenAt);
      setLoaded(true);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isUnread = (item: NotificationItem) => (seenAt ? new Date(item.created_at) > new Date(seenAt) : false);
  const hasUnread = loaded && items.some(isUnread);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    if (box.current) {
      const rect = box.current.getBoundingClientRect();
      const width = Math.min(window.innerWidth - EDGE_GAP * 2, PANEL_MAX);
      setAlignRight(rect.left + width > window.innerWidth - EDGE_GAP);
    }
    const unread = items.filter(isUnread);
    setFreshKeys(unread.map((i) => `${i.type}-${i.id}`));
    setOpen(true);
    if (unread.length === 0) return;
    setSeenAt(new Date().toISOString());
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.seenAt) setSeenAt(data.seenAt);
      }
    } catch {
      return;
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={hasUnread ? "Notifications, you have unread notifications" : "Notifications"}
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-royal text-white transition ${
          hasUnread ? "opacity-100 brightness-125 ring-2 ring-sun/70" : "opacity-80 hover:opacity-100"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications"
          className={`absolute top-full z-50 mt-3 w-[min(calc(100vw-1.5rem),26rem)] rounded-3xl border border-ink/10 bg-white p-4 text-left shadow-xl ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <p className="px-2 pb-3 text-sm font-semibold uppercase tracking-widest text-ink/70">Notifications</p>
          {items.length === 0 ? (
            <p className="px-2 py-6 text-base font-semibold text-ink/70">Nothing new yet.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-ink/10 overflow-y-auto">
              {items.map((item) => {
                const key = `${item.type}-${item.id}`;
                const fresh = freshKeys.includes(key);
                return (
                  <li key={key} className={`rounded-2xl px-3 py-3 ${fresh ? "bg-sun/20" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-bold text-ink">
                        {item.type === "blog" ? "New blog post" : "New highlight"}
                      </p>
                      {fresh && (
                        <span className="rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white">New</span>
                      )}
                    </div>
                    {item.type === "blog" && item.title && (
                      <p className="mt-1 text-base font-semibold text-ink">{item.title}</p>
                    )}
                    {item.detail && <p className="mt-1 text-sm text-ink/80">{item.detail}</p>}
                    <p className="mt-1 text-xs font-semibold text-ink/60">{formatTime(item.created_at)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}