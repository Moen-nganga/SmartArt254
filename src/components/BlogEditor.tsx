import { useState } from "react";
import type { ChangeEvent } from "react";

export interface Post {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  imageIds: number[];
}

interface Props {
  post?: Post;
  onSaved: () => void;
  onCancel: () => void;
}

const MAX_NEW = 4;

const field =
  "mt-2 w-full rounded-2xl border-2 border-ink/20 bg-white px-5 py-3.5 text-lg font-semibold text-ink placeholder:text-ink/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
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
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that picture."));
    };
    img.src = url;
  });
}

export default function BlogEditor({ post, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const kept = (post?.imageIds ?? []).filter((id) => !removed.includes(id));

  async function addFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_NEW - newImages.length);
    e.target.value = "";
    try {
      const converted = await Promise.all(files.map(compress));
      setNewImages((prev) => [...prev, ...converted].slice(0, MAX_NEW));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that picture.");
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = post
        ? { id: post.id, title, body, addImages: newImages, removeImageIds: removed }
        : { title, body, images: newImages };
      const res = await fetch("/api/blog", {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save this post.");
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
      <h2 className="text-2xl font-extrabold">{post ? "Edit post" : "New post"}</h2>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-5">
        <label className="block text-base font-bold">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <label className="block text-base font-bold">
          Text
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className={field} />
        </label>

        <div>
          <p className="text-base font-bold">Pictures</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {kept.map((id) => (
              <div key={id} className="relative">
                <img src={`/api/blog?image=${id}`} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                <button
                  type="button"
                  aria-label="Remove picture"
                  onClick={() => setRemoved([...removed, id])}
                  className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-pink text-base font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {newImages.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                <button
                  type="button"
                  aria-label="Remove picture"
                  onClick={() => setNewImages(newImages.filter((_, n) => n !== i))}
                  className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-pink text-base font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {newImages.length < MAX_NEW && (
            <label className="mt-3 inline-block cursor-pointer rounded-full border-2 border-ink px-5 py-2.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white">
              Add pictures
              <input type="file" accept="image/*" multiple onChange={addFiles} className="sr-only" />
            </label>
          )}
          <p className="mt-2 text-sm text-ink/70">Up to {MAX_NEW} new pictures per save. They are resized automatically.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !title.trim() || !body.trim()}
            className="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {saving ? "Saving" : post ? "Save changes" : "Publish"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border-2 border-ink px-7 py-3 text-lg font-bold text-ink transition hover:bg-ink hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}