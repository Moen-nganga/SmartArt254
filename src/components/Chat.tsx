import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { upload } from "@vercel/blob/client";
import type { User } from "../auth";

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime";
const ALLOWED = ACCEPT.split(",");

interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

interface ApiMessage {
  id: number;
  senderId: number;
  senderName?: string;
  text: string | null;
  attachment: Attachment | null;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  mine: boolean;
  sender: string;
  text: string | null;
  attachment: Attachment | null;
  at: string;
  pending?: boolean;
}

interface Picked {
  file: File;
  preview: string;
}

interface ConversationItem {
  memberId: number;
  name: string;
  email: string | null;
  phone: string | null;
  preview: string;
  at: string;
}

async function api(query: string, init?: RequestInit) {
  const res = await fetch(`/api/messages?${query}`, init);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/signin?next=/member";
    throw new Error("Please sign in.");
  }
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

function post(action: string, body: object) {
  return api(`action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function clock(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function stamp(value: string) {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? clock(value)
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function sizeLabel(bytes: number) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function safeName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  return cleaned || "file";
}

function Media({ attachment, onLoad }: { attachment: Attachment; onLoad: () => void }) {
  if (attachment.type.startsWith("video/")) {
    return (
      <video
        src={attachment.url}
        controls
        preload="metadata"
        playsInline
        onLoadedMetadata={onLoad}
        className="max-h-72 w-full rounded-xl bg-black"
      />
    );
  }
  return (
    <a href={attachment.url} target="_blank" rel="noreferrer">
      <img
        src={attachment.url}
        alt={attachment.name}
        loading="lazy"
        onLoad={onLoad}
        className="max-h-72 w-full rounded-xl object-cover"
      />
    </a>
  );
}

function Thread({
  user,
  memberId,
  heading,
  subheading,
  onBack,
  onSent,
}: {
  user: User;
  memberId: number;
  heading: string;
  subheading?: string;
  onBack?: () => void;
  onSent?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [progress, setProgress] = useState<{ id: number; percent: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const tempId = useRef(0);
  const poll = useRef<() => void>(() => {});
  const activeUntil = useRef(0);

  useEffect(() => {
    let active = true;
    let busy = false;
    let timer = 0;
    let lastId = 0;
    setMessages([]);
    setLoaded(false);
    setError("");
    queue.current = Promise.resolve();

    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const data = await api(`action=messages&memberId=${memberId}&after=${lastId}`);
        const incoming: ApiMessage[] = data.messages;
        if (!active) return;
        if (incoming.length) {
          const decoded: ChatMessage[] = incoming.map((m) => ({
            id: m.id,
            mine: m.senderId === user.id,
            sender: m.senderName ?? "",
            text: m.text,
            attachment: m.attachment,
            at: m.createdAt,
          }));
          lastId = incoming[incoming.length - 1].id;
          activeUntil.current = Date.now() + 30000;
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = decoded.filter((m) => !seen.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
        }
        setLoaded(true);
      } catch {
        if (active) setLoaded(true);
      } finally {
        busy = false;
      }
    };

    const schedule = () => {
      window.clearTimeout(timer);
      const fast = Date.now() < activeUntil.current;
      timer = window.setTimeout(run, document.hidden ? 15000 : fast ? 1000 : 4000);
    };

    const run = async () => {
      await tick();
      if (active) schedule();
    };

    const wake = () => {
      if (!document.hidden) poll.current();
    };

    poll.current = () => {
      window.clearTimeout(timer);
      run();
    };

    run();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [memberId, user.id]);

  const scrollDown = () => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollDown();
  }, [messages.length, loaded]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Only photos (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) can be sent.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Files must be 100 MB or smaller.");
      return;
    }
    setError("");
    setPicked((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  };

  const clearPicked = () => {
    setPicked((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return null;
    });
  };

  const fail = (temp: number, body: string, current: Picked | null, message: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== temp));
    setText((prev) => prev || body);
    if (current) {
      setPicked((prev) => {
        if (prev) {
          URL.revokeObjectURL(current.preview);
          return prev;
        }
        return current;
      });
    }
    setError(message);
  };

  const deliver = async (temp: number, body: string, current: Picked | null) => {
    try {
      let attachment: Attachment | null = null;
      if (current) {
        setProgress({ id: temp, percent: 0 });
        const blob = await upload(`chat/${user.id}/${safeName(current.file.name)}`, current.file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: current.file.type,
          multipart: current.file.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress({ id: temp, percent: Math.round(percentage) }),
        });
        attachment = {
          url: blob.url,
          type: current.file.type,
          name: current.file.name,
          size: current.file.size,
        };
      }
      const data = await post("send", {
        memberId,
        text: body,
        attachment: attachment ? { url: attachment.url, name: attachment.name } : undefined,
      });
      setProgress(null);
      setMessages((prev) =>
        prev.some((m) => m.id === data.id)
          ? prev.filter((m) => m.id !== temp)
          : prev.map((m) => (m.id === temp ? { ...m, id: data.id, pending: false, attachment } : m)),
      );
      if (current) URL.revokeObjectURL(current.preview);
      poll.current();
      onSent?.();
    } catch (e) {
      setProgress(null);
      fail(temp, body, current, e instanceof Error ? e.message : "Could not send your message.");
    }
  };

  const send = () => {
    const body = text.trim();
    const current = picked;
    if (!body && !current) return;
    const temp = --tempId.current;
    activeUntil.current = Date.now() + 30000;
    setText("");
    setError("");
    setPicked(null);
    setMessages((prev) => [
      ...prev,
      {
        id: temp,
        mine: true,
        sender: "",
        text: body,
        attachment: current
          ? { url: current.preview, type: current.file.type, name: current.file.name, size: current.file.size }
          : null,
        at: new Date().toISOString(),
        pending: true,
      },
    ]);
    queue.current = queue.current.then(() => deliver(temp, body, current));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-4 sm:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="rounded-full border-2 border-ink px-3 py-1 text-base font-bold text-ink md:hidden"
          >
            Back
          </button>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold">{heading}</h2>
          {subheading && <p className="truncate text-sm font-semibold text-ink/70">{subheading}</p>}
        </div>
      </div>

      <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
        {!loaded ? (
          <p className="text-base font-semibold text-ink/70">Loading messages</p>
        ) : messages.length === 0 ? (
          <p className="mx-auto mt-10 max-w-xs text-center text-base font-semibold text-ink/70">
            {user.isAdmin ? "No messages in this conversation yet." : "Send a message and a host will reply here."}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  m.mine ? "rounded-br-md bg-royal text-white" : "rounded-bl-md bg-ink/10 text-ink"
                } ${m.pending ? "opacity-70" : ""}`}
              >
                {!m.mine && (
                  <p className="text-sm font-bold text-royal">{user.isAdmin ? m.sender : "Host"}</p>
                )}
                {m.attachment && (
                  <div className={`w-60 max-w-full sm:w-72 ${m.text ? "mb-2" : ""}`}>
                    <Media attachment={m.attachment} onLoad={scrollDown} />
                  </div>
                )}
                {m.text === null ? (
                  <p className="text-base italic opacity-80">This message could not be loaded.</p>
                ) : (
                  m.text && <p className="whitespace-pre-wrap break-words text-base font-semibold">{m.text}</p>
                )}
                <p className={`mt-1 text-right text-xs font-semibold ${m.mine ? "text-white/80" : "text-ink/60"}`}>
                  {m.pending
                    ? progress && progress.id === m.id
                      ? `Uploading ${progress.percent}%`
                      : "Sending"
                    : clock(m.at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <p role="alert" className="mx-4 mb-3 rounded-xl bg-pink px-4 py-3 font-semibold text-white sm:mx-6">
          {error}
        </p>
      )}

      <div className="border-t border-ink/10 px-4 py-4 sm:px-6">
        {picked && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-ink/5 p-2">
            {picked.file.type.startsWith("video/") ? (
              <video
                src={`${picked.preview}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                className="h-14 w-14 shrink-0 rounded-xl bg-black object-cover"
              />
            ) : (
              <img src={picked.preview} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{picked.file.name}</p>
              <p className="text-xs font-semibold text-ink/70">{sizeLabel(picked.file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearPicked}
              aria-label="Remove attachment"
              className="rounded-full border-2 border-ink px-3 py-1 text-sm font-bold text-ink transition hover:bg-ink/5"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex items-end gap-3">
          <input ref={fileInput} type="file" accept={ACCEPT} onChange={onPick} className="hidden" />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label="Attach a photo or video"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink/20 text-ink transition hover:border-royal hover:text-royal focus:outline-none focus:ring-2 focus:ring-royal/60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            aria-label="Message"
            placeholder="Type a message"
            className="max-h-32 min-h-[3rem] flex-1 resize-none rounded-2xl border-2 border-ink/20 bg-white px-4 py-2.5 text-base font-semibold text-ink placeholder:text-ink/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30"
          />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim() && !picked}
            className="rounded-full bg-sun px-6 py-3 text-base font-bold text-ink transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-royal/60 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminChat({ user }: { user: User }) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (document.hidden && version > 0) return;
      try {
        const data = await api("action=conversations");
        const next: ConversationItem[] = data.conversations.map(
          (c: {
            memberId: number;
            name: string;
            email: string | null;
            phone: string | null;
            last: { senderId: number; text: string | null; attachmentType: string | null; createdAt: string };
          }) => {
            const media = c.last.attachmentType
              ? c.last.attachmentType.startsWith("video/")
                ? "Video"
                : "Photo"
              : null;
            const body = c.last.text || media || (c.last.text === null ? "Message could not be loaded" : "");
            return {
              memberId: c.memberId,
              name: c.name,
              email: c.email,
              phone: c.phone,
              preview: c.last.senderId === user.id ? `You: ${body}` : body,
              at: c.last.createdAt,
            };
          },
        );
        if (active) setItems(next);
      } catch {
        return;
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user.id, version]);

  const current = items.find((i) => i.memberId === selected) ?? null;

  return (
    <div className="grid h-full md:grid-cols-[20rem_1fr]">
      <div
        className={`${selected === null ? "block" : "hidden"} min-h-0 overflow-y-auto border-ink/10 md:block md:border-r`}
      >
        <div className="border-b border-ink/10 px-4 py-4 sm:px-6">
          <h2 className="text-xl font-extrabold">Conversations</h2>
        </div>
        {loading ? (
          <p className="px-6 py-5 text-base font-semibold text-ink/70">Loading conversations</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-5 text-base font-semibold text-ink/70">No one has sent a message yet.</p>
        ) : (
          <ul>
            {items.map((i) => (
              <li key={i.memberId}>
                <button
                  type="button"
                  onClick={() => setSelected(i.memberId)}
                  aria-current={selected === i.memberId ? "true" : undefined}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition sm:px-6 ${
                    selected === i.memberId ? "bg-royal/10" : "hover:bg-ink/5"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal text-lg font-extrabold text-white"
                  >
                    {i.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-base font-extrabold">{i.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink/60">{stamp(i.at)}</span>
                    </span>
                    <span className="block truncate text-sm font-semibold text-ink/70">{i.preview}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${selected === null ? "hidden" : "block"} min-h-0 md:block`}>
        {selected === null || !current ? (
          <div className="flex h-full items-center justify-center px-6">
            <p className="max-w-xs text-center text-base font-semibold text-ink/70">
              Choose a conversation to read and reply.
            </p>
          </div>
        ) : (
          <Thread
            key={selected}
            user={user}
            memberId={selected}
            heading={current.name}
            subheading={current.email ?? current.phone ?? undefined}
            onBack={() => setSelected(null)}
            onSent={() => setVersion((v) => v + 1)}
          />
        )}
      </div>
    </div>
  );
}

export default function Chat({ user }: { user: User }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
      <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
        {user.isAdmin ? "Talk to a user" : "Talk to a host"}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/80 sm:text-xl">
        {user.isAdmin
          ? "Messages from members appear here. They are stored encrypted and only admins can read them."
          : "Message our team directly. Your messages are stored encrypted, so only you and our hosts can read them."}
      </p>

      <div className="mt-8 h-[70vh] min-h-[26rem] overflow-hidden rounded-3xl border border-ink/10 bg-white/80 shadow-xl backdrop-blur-sm">
        {user.isAdmin ? (
          <AdminChat user={user} />
        ) : (
          <Thread user={user} memberId={user.id} heading="SmartArt254 hosts" subheading="Private conversation" />
        )}
      </div>
    </section>
  );
}