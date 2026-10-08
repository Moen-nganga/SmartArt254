import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import BlogEditor from "../components/BlogEditor";
import type { Post } from "../components/BlogEditor";
import { getUser } from "../auth";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Post | "new" | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/blog");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load the blog.");
      setPosts(data.posts);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the blog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getUser().then((user) => setIsAdmin(Boolean(user?.isAdmin)));
  }, [load]);

  async function remove(id: number) {
    setConfirming(null);
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPosts((current) => current.filter((p) => p.id !== id));
    } catch {
      setError("Could not delete that post. Please try again.");
    }
  }

  function saved() {
    setEditing(null);
    load();
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-5 pb-16 pt-4 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-6xl">Blog</h1>
            <p className="mt-3 max-w-2xl text-lg text-ink/80 sm:text-xl">
              Art ideas, event tips and stories from our sessions.
            </p>
          </div>
          {isAdmin && editing === null && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink"
            >
              New post
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-pink px-4 py-3 font-semibold text-white">
            {error}
          </p>
        )}

        {editing === "new" && (
          <div className="mt-8">
            <BlogEditor onSaved={saved} onCancel={() => setEditing(null)} />
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-xl font-semibold">Loading</p>
        ) : posts.length === 0 && editing !== "new" ? (
          <p className="mt-10 text-xl text-ink/80">
            Blogs from our recent art events and conventions will be regularly updated here.
          </p>
        ) : (
          <div className="mt-10 grid gap-10">
            {posts.map((post) =>
              typeof editing === "object" && editing?.id === post.id ? (
                <BlogEditor key={post.id} post={post} onSaved={saved} onCancel={() => setEditing(null)} />
              ) : (
                <article
                  key={post.id}
                  className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8"
                >
                  {post.imageIds.length > 0 && (
                    <div className="mb-6 grid gap-3">
                      <img
                        src={`/api/blog?image=${post.imageIds[0]}`}
                        alt=""
                        loading="lazy"
                        className="aspect-[16/9] w-full rounded-2xl object-cover"
                      />
                      {post.imageIds.length > 1 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {post.imageIds.slice(1).map((id) => (
                            <img
                              key={id}
                              src={`/api/blog?image=${id}`}
                              alt=""
                              loading="lazy"
                              className="aspect-square w-full rounded-2xl object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">
                    {formatDate(post.createdAt)}
                  </p>
                  <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{post.title}</h2>
                  <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink/90">{post.body}</p>

                  {isAdmin && (
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-ink/10 pt-5">
                      <button
                        type="button"
                        onClick={() => setEditing(post)}
                        className="rounded-full border-2 border-ink px-5 py-2.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white"
                      >
                        Edit
                      </button>
                      {confirming === post.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => remove(post.id)}
                            className="rounded-full bg-pink px-5 py-2.5 text-base font-bold text-white"
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="rounded-full border-2 border-ink px-5 py-2.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(post.id)}
                          className="rounded-full border-2 border-pink px-5 py-2.5 text-base font-bold text-pink transition hover:bg-pink hover:text-white"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}