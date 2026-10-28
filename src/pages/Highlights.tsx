import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { upload } from "@vercel/blob/client";
import Layout from "../components/Layout";
import { getUser } from "../auth";
import type { User } from "../auth";
import { apiUrl, getToken } from "../native";

interface Highlight {
  id: number;
  url: string;
  caption: string | null;
  createdAt: string;
  userId: number;
  name: string;
}

interface Group {
  userId: number;
  name: string;
  items: Highlight[];
}

interface Draft {
  file: File;
  preview: string;
}

const DURATION = 5000;
const DAY = 24 * 60 * 60 * 1000;
const MAX_CAPTION = 140;

const field =
  "mt-4 w-full rounded-2xl border-2 border-ink/20 bg-white px-5 py-3.5 text-lg font-semibold text-ink placeholder:text-ink/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

function stamp(value: string) {
  return new Date(value).getTime();
}

function ago(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - stamp(value)) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function groupUp(list: Highlight[], me: number): Group[] {
  const map = new Map<number, Group>();
  [...list]
    .sort((a, b) => stamp(a.createdAt) - stamp(b.createdAt))
    .forEach((h) => {
      const group = map.get(h.userId) ?? { userId: h.userId, name: h.name, items: [] };
      group.items.push(h);
      map.set(h.userId, group);
    });
  const latest = (g: Group) => stamp(g.items[g.items.length - 1].createdAt);
  return Array.from(map.values()).sort((a, b) => {
    if (a.userId === me) return -1;
    if (b.userId === me) return 1;
    return latest(b) - latest(a);
  });
}

function compress(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Could not process that picture."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not process that picture."));
            return;
          }
          resolve(new File([blob], "highlight.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that picture."));
    };
    img.src = url;
  });
}

export default function Highlights() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Highlight[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState<number | null>(null);
  const [viewer, setViewer] = useState<{ group: number; item: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const viewerOpen = useRef(false);
  const groupsRef = useRef<Group[]>([]);

  const live = items.filter((h) => Date.now() - stamp(h.createdAt) < DAY);
  const groups = groupUp(live, user?.id ?? 0);
  groupsRef.current = groups;
  viewerOpen.current = viewer !== null;

  const currentGroup = viewer ? groups[viewer.group] : undefined;
  const current = viewer && currentGroup ? currentGroup.items[viewer.item] : undefined;
  const group = viewer?.group;
  const item = viewer?.item;

  useEffect(() => {
    getUser().then((found) => {
      if (!found) {
        window.location.href = "/signin?next=/highlights";
        return;
      }
      setUser(found);
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/highlights");
      if (res.status === 401) {
        window.location.href = "/signin?next=/highlights";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load highlights.");
      setItems(data.highlights);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load highlights.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (!document.hidden && !viewerOpen.current) load();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  const next = useCallback(() => {
    setViewer((v) => {
      if (!v) return v;
      const g = groupsRef.current[v.group];
      if (g && v.item < g.items.length - 1) return { group: v.group, item: v.item + 1 };
      if (v.group < groupsRef.current.length - 1) return { group: v.group + 1, item: 0 };
      return null;
    });
  }, []);

  const prev = useCallback(() => {
    setViewer((v) => {
      if (!v) return v;
      if (v.item > 0) return { group: v.group, item: v.item - 1 };
      if (v.group > 0) {
        const g = groupsRef.current[v.group - 1];
        return { group: v.group - 1, item: g ? g.items.length - 1 : 0 };
      }
      return { group: v.group, item: 0 };
    });
  }, []);

  useEffect(() => {
    if (group === undefined || item === undefined) return;
    setProgress(0);
    setConfirming(false);
    const start = Date.now();
    const timer = window.setInterval(() => {
      const p = (Date.now() - start) / DURATION;
      if (p >= 1) {
        window.clearInterval(timer);
        next();
      } else {
        setProgress(p);
      }
    }, 60);
    return () => window.clearInterval(timer);
  }, [group, item, next]);

  useEffect(() => {
    if (viewer && !current) setViewer(null);
  }, [viewer, current]);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    try {
      const small = await compress(file);
      setDraft((prevDraft) => {
        if (prevDraft) URL.revokeObjectURL(prevDraft.preview);
        return { file: small, preview: URL.createObjectURL(small) };
      });
      setCaption("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that picture.");
    }
  };

  const cancelDraft = () => {
    setDraft((prevDraft) => {
      if (prevDraft) URL.revokeObjectURL(prevDraft.preview);
      return null;
    });
    setCaption("");
  };

  const post = async () => {
    if (!draft || !user) return;
    setPosting(0);
    setError("");
    try {
      const blob = await upload(`highlights/${user.id}/highlight.jpg`, draft.file, {
        access: "public",
        handleUploadUrl: apiUrl("/api/upload"),
        contentType: "image/jpeg",
        clientPayload: getToken() ?? undefined,
        onUploadProgress: ({ percentage }) => setPosting(Math.round(percentage)),
      });
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, caption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not post your highlight.");
      URL.revokeObjectURL(draft.preview);
      setDraft(null);
      setCaption("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post your highlight.");
    } finally {
      setPosting(null);
    }
  };

  const remove = async (id: number) => {
    setViewer(null);
    try {
      const res = await fetch(`/api/highlights?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load();
    } catch {
      setError("Could not delete that highlight. Please try again.");
    }
  };

  const onViewerTap = (e: MouseEvent<HTMLDivElement>) => {
    if (e.clientX / window.innerWidth < 0.3) prev();
    else next();
  };

  const canDelete = Boolean(user && current && (current.userId === user.id || user.isAdmin));

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-5 pb-16 pt-4 sm:px-10">
        <h1 className="text-4xl font-extrabold sm:text-6xl">Highlights</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink/80 sm:text-xl">
          Moments from recent events, shared by everyone here. Each one disappears after 24 hours.
        </p>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
            {error}
          </p>
        )}

        <input ref={fileInput} type="file" accept="image/*" onChange={onPick} className="hidden" />

        {draft && (
          <div className="mt-6 rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl backdrop-blur-sm">
            <img src={draft.preview} alt="" className="max-h-80 w-full rounded-2xl bg-ink/5 object-contain" />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={MAX_CAPTION}
              placeholder="Add a caption (optional)"
              aria-label="Caption"
              className={field}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={post}
                disabled={posting !== null}
                className="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink transition hover:brightness-105 disabled:opacity-60"
              >
                {posting !== null ? `Posting ${posting}%` : "Post highlight"}
              </button>
              <button
                type="button"
                onClick={cancelDraft}
                disabled={posting !== null}
                className="rounded-full border-2 border-ink px-7 py-3 text-lg font-bold text-ink transition hover:bg-ink hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-6">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={draft !== null}
            className="flex w-24 flex-col items-center text-center disabled:opacity-50"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-ink/50 bg-white/70 text-4xl font-bold text-ink">
              +
            </span>
            <span className="mt-2 text-sm font-bold">Add yours</span>
          </button>

          {groups.map((g, i) => {
            const mine = user !== null && g.userId === user.id;
            const cover = g.items[g.items.length - 1];
            return (
              <button
                key={g.userId}
                type="button"
                onClick={() => setViewer({ group: i, item: 0 })}
                className="flex w-24 flex-col items-center text-center"
              >
                <span className={`rounded-full border-4 p-0.5 ${mine ? "border-sun" : "border-royal"}`}>
                  <img src={cover.url} alt="" loading="lazy" className="h-[4.5rem] w-[4.5rem] rounded-full object-cover" />
                </span>
                <span className="mt-2 w-full truncate text-sm font-bold">{mine ? "Your highlights" : g.name || "Member"}</span>
                <span className="text-xs font-semibold text-ink/70">{ago(cover.createdAt)}</span>
              </button>
            );
          })}
        </div>

        {!loaded ? (
          <p className="mt-10 text-xl font-semibold">Loading</p>
        ) : groups.length === 0 ? (
          <p className="mt-10 text-xl text-ink/80">
            Nothing here right now. Be the first to share a moment from a recent event.
          </p>
        ) : null}
      </section>

      {viewer && current && currentGroup && (
        <div className="fixed inset-0 z-50 flex touch-none select-none flex-col bg-black" onClick={onViewerTap}>
          <img src={current.url} alt="" className="absolute inset-0 h-full w-full object-contain" />

          <div
            className="relative z-10 px-4 pb-8"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
            }}
          >
            <div className="flex gap-1">
              {currentGroup.items.map((h, n) => (
                <div key={h.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-white"
                    style={{ width: n < viewer.item ? "100%" : n === viewer.item ? `${progress * 100}%` : "0%" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-white">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-royal text-lg font-extrabold"
              >
                {(currentGroup.name || "M").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{currentGroup.name || "Member"}</p>
                <p className="text-sm font-semibold text-white/80">{ago(current.createdAt)}</p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirming) remove(current.id);
                    else setConfirming(true);
                  }}
                  className="rounded-full border-2 border-white px-4 py-1.5 text-sm font-bold text-white"
                >
                  {confirming ? "Tap again to delete" : "Delete"}
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewer(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white"
              >
                ×
              </button>
            </div>
          </div>

          {current.caption && (
            <p
              className="absolute inset-x-0 bottom-0 z-10 px-5 pt-12 text-center text-lg font-semibold text-white"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
                background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
              }}
            >
              {current.caption}
            </p>
          )}
        </div>
      )}
    </Layout>
  );
}