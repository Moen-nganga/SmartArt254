import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { User } from "../auth";
import { decryptMessage, encryptMessage, ensureIdentity } from "../crypto";
import type { Identity, IncomingMessage, Recipient } from "../crypto";

interface ApiMessage extends IncomingMessage {
  id: number;
  senderId: number;
  senderName?: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  mine: boolean;
  sender: string;
  text: string | null;
  at: string;
  pending?: boolean;
}

interface ConversationItem {
  memberId: number;
  name: string;
  email: string | null;
  phone: string | null;
  preview: string;
  at: string;
}

const KEY_REFRESH_MS = 30000;
const keyCache = new Map<number, { at: number; keys: Recipient[] }>();

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

async function loadKeys(memberId: number) {
  const data = await api(`action=keys&memberId=${memberId}`);
  const keys: Recipient[] = data.keys;
  keyCache.set(memberId, { at: Date.now(), keys });
  return keys;
}

async function getKeys(memberId: number, force = false) {
  const cached = keyCache.get(memberId);
  if (!cached || force) return loadKeys(memberId);
  if (Date.now() - cached.at > KEY_REFRESH_MS) loadKeys(memberId).catch(() => {});
  return cached.keys;
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

function Thread({
  user,
  identity,
  memberId,
  heading,
  subheading,
  onBack,
  onSent,
}: {
  user: User;
  identity: Identity;
  memberId: number;
  heading: string;
  subheading?: string;
  onBack?: () => void;
  onSent?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const list = useRef<HTMLDivElement>(null);
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
    getKeys(memberId).catch(() => {});

    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const data = await api(`action=messages&memberId=${memberId}&after=${lastId}`);
        const incoming: ApiMessage[] = data.messages;
        if (!active) return;
        if (incoming.length) {
          const decoded: ChatMessage[] = await Promise.all(
            incoming.map(async (m) => ({
              id: m.id,
              mine: m.senderId === user.id,
              sender: m.senderName ?? "",
              text: await decryptMessage(identity, m),
              at: m.createdAt,
            })),
          );
          if (!active) return;
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
  }, [memberId, user.id, identity]);

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loaded]);

  const reachable = (keys: Recipient[]) =>
    user.isAdmin ? keys.some((k) => k.userId === memberId) : keys.some((k) => k.userId !== memberId);

  const fail = (temp: number, body: string, message: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== temp));
    setText((prev) => prev || body);
    setError(message);
  };

  const deliver = async (temp: number, body: string) => {
    try {
      let keys = await getKeys(memberId);
      if (!reachable(keys)) keys = await getKeys(memberId, true);
      if (!reachable(keys)) {
        fail(
          temp,
          body,
          user.isAdmin
            ? "This user has not opened their chat yet, so the message cannot be encrypted for them."
            : "No host has opened the chat yet. Please use WhatsApp or the booking form for now.",
        );
        return;
      }
      const recipients: Recipient[] = [
        ...keys.filter((k) => k.userId !== user.id),
        { userId: user.id, publicKey: identity.publicKey },
      ];
      const payload = await encryptMessage(identity, body, recipients);
      const data = await post("send", { memberId, ...payload });
      setMessages((prev) =>
        prev.some((m) => m.id === data.id)
          ? prev.filter((m) => m.id !== temp)
          : prev.map((m) => (m.id === temp ? { ...m, id: data.id, pending: false } : m)),
      );
      poll.current();
      onSent?.();
    } catch (e) {
      fail(temp, body, e instanceof Error ? e.message : "Could not send your message.");
    }
  };

  const send = () => {
    const body = text.trim();
    if (!body) return;
    const temp = --tempId.current;
    activeUntil.current = Date.now() + 30000;
    setText("");
    setError("");
    setMessages((prev) => [
      ...prev,
      { id: temp, mine: true, sender: "", text: body, at: new Date().toISOString(), pending: true },
    ]);
    queue.current = queue.current.then(() => deliver(temp, body));
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
                {m.text === null ? (
                  <p className="text-base italic opacity-80">This message cannot be read on this device.</p>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-base font-semibold">{m.text}</p>
                )}
                <p className={`mt-1 text-right text-xs font-semibold ${m.mine ? "text-white/80" : "text-ink/60"}`}>
                  {m.pending ? "Sending" : clock(m.at)}
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

      <div className="flex items-end gap-3 border-t border-ink/10 px-4 py-4 sm:px-6">
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
          disabled={!text.trim()}
          className="rounded-full bg-sun px-6 py-3 text-base font-bold text-ink transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-royal/60 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function AdminChat({ user, identity }: { user: User; identity: Identity }) {
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
        const next: ConversationItem[] = await Promise.all(
          data.conversations.map(
            async (c: { memberId: number; name: string; email: string | null; phone: string | null; last: ApiMessage }) => {
              const text = await decryptMessage(identity, c.last);
              const body = text ?? "Encrypted message";
              return {
                memberId: c.memberId,
                name: c.name,
                email: c.email,
                phone: c.phone,
                preview: c.last.senderId === user.id ? `You: ${body}` : body,
                at: c.last.createdAt,
              };
            },
          ),
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
  }, [identity, user.id, version]);

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
            identity={identity}
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
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    ensureIdentity(user.id)
      .then(async (found) => {
        await post("key", { publicKey: found.publicKey });
        if (active) setIdentity(found);
      })
      .catch(() => {
        if (active) setError("Secure chat could not start in this browser. Please try another browser.");
      });
    return () => {
      active = false;
    };
  }, [user.id]);

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 sm:py-16">
      <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
        {user.isAdmin ? "Talk to a user" : "Talk to a host"}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink/80 sm:text-xl">
        {user.isAdmin
          ? "Messages from members appear here. They are end-to-end encrypted and can only be read in this browser."
          : "Message our team directly. Your messages are end-to-end encrypted, so only you and our hosts can read them."}
      </p>

      <div className="mt-8 h-[70vh] min-h-[26rem] overflow-hidden rounded-3xl border border-ink/10 bg-white/80 shadow-xl backdrop-blur-sm">
        {error ? (
          <p role="alert" className="m-6 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
            {error}
          </p>
        ) : !identity ? (
          <p className="p-6 text-lg font-semibold">Setting up secure chat</p>
        ) : user.isAdmin ? (
          <AdminChat user={user} identity={identity} />
        ) : (
          <Thread
            user={user}
            identity={identity}
            memberId={user.id}
            heading="SmartArt254 hosts"
            subheading="End-to-end encrypted"
          />
        )}
      </div>
    </section>
  );
}