import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Highlight from "../components/Highlight";
import Photo from "../components/Photo";
import AutoVideo from "../components/AutoVideo";
import Reveal from "../components/Reveal";
import WhatsAppMenu from "../components/WhatsAppMenu";
import { link } from "../navigate";
import items from "virtual:gallery";

type Filter = "all" | "image" | "video";

const dots = ["bg-pink", "bg-sun", "bg-leaf", "bg-royal"];

const arrow = "M9 5l7 7-7 7";

function Glyph({ d, className = "h-6 w-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  const photoCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.length - photoCount;

  const visible = useMemo(() => (filter === "all" ? items : items.filter((i) => i.type === filter)), [filter]);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) => setOpen((c) => (c === null ? c : (c + delta + visible.length) % visible.length)),
    [visible.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close, step]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${items.length})` },
    { key: "image", label: `Photos (${photoCount})` },
    { key: "video", label: `Videos (${videoCount})` },
  ];

  const current = open !== null ? visible[open] : null;

  return (
    <Layout>
      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-10 sm:pt-14">
        <span aria-hidden="true" className="absolute right-6 top-4 hidden h-28 w-28 rounded-full bg-pink/15 md:block" />
        <span aria-hidden="true" className="absolute right-32 top-24 hidden h-14 w-14 rounded-full bg-sun/40 md:block" />
        <span aria-hidden="true" className="absolute right-10 top-44 hidden h-8 w-8 rounded-full bg-leaf/40 md:block" />

        <p className="relative flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-ink/70">
          <span className="h-1 w-8 rounded-full bg-sun" />
          Gallery
        </p>
        <h1 className="relative mt-4 max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-7xl">
          A collection of events <Highlight>we've worked on before.</Highlight>
        </h1>
        <p className="relative mt-6 max-w-2xl text-lg text-ink/80 sm:text-xl">
          A look at the art, the faces and the fun from our sessions at schools, parties, weddings and family days across Kenya.
        </p>

        <div className="relative mt-7 flex items-center gap-3" aria-hidden="true">
          {dots.map((d) => (
            <span key={d} className={`h-7 w-7 rounded-full ${d}`} />
          ))}
        </div>

        {photoCount > 0 && videoCount > 0 ? (
          <div className="relative mt-8 flex flex-wrap gap-3">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`rounded-full border-2 border-ink px-6 py-2.5 text-lg font-bold transition ${
                  filter === f.key ? "bg-ink text-white" : "text-ink hover:bg-ink hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-10">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-xl text-ink/70">New photos and videos are coming soon.</p>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {visible.map((item, i) => (
              <div key={item.src} className="mb-6 break-inside-avoid">
                <Reveal from="up" delay={(i % 3) * 100}>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`Open ${item.alt}`}
                    className="group relative block w-full cursor-zoom-in overflow-hidden rounded-[1.75rem] bg-white p-2 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="overflow-hidden rounded-3xl">
                      {item.type === "video" ? (
                        <AutoVideo
                          src={item.src}
                          label={item.alt}
                          className="w-full transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Photo
                          src={item.src}
                          alt={item.alt}
                          className="w-full transition duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    {item.type === "video" ? (
                      <span className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-sm font-bold text-white backdrop-blur">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M7 4l13 8-13 8z" />
                        </svg>
                        Video
                      </span>
                    ) : null}
                  </button>
                </Reveal>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <Reveal from="up">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-center text-white shadow-2xl sm:p-14">
            <span aria-hidden="true" className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-pink/30" />
            <span aria-hidden="true" className="absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-sun/25" />
            <span aria-hidden="true" className="absolute bottom-10 left-16 hidden h-10 w-10 rounded-full bg-leaf/40 sm:block" />
            <h2 className="relative text-3xl font-extrabold sm:text-5xl">Want to be in our next photo?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-lg text-white/85">
              Tell us your date and group size and we will confirm a host.
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="/book" onClick={link("/book")} className="rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink">
                Book an activity
              </a>
              <WhatsAppMenu
                label="Chat on WhatsApp"
                buttonClassName="rounded-full border-2 border-white px-7 py-3 text-lg font-bold text-white transition hover:bg-white/10"
                menuClassName="left-1/2 -translate-x-1/2"
              />
            </div>
          </div>
        </Reveal>
      </section>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 sm:p-10"
          onClick={close}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          >
            <Glyph d="M6 6l12 12M18 6L6 18" />
          </button>

          {visible.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-6"
              >
                <Glyph d="M15 5l-7 7 7 7" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-6"
              >
                <Glyph d={arrow} />
              </button>
            </>
          ) : null}

          <div className="flex max-h-full max-w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {current.type === "video" ? (
              <video
                key={current.src}
                src={current.src}
                aria-label={current.alt}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[80vh] max-w-full rounded-2xl"
              />
            ) : (
              <img
                key={current.src}
                src={current.src}
                alt={current.alt}
                className="max-h-[80vh] max-w-full rounded-2xl object-contain"
              />
            )}
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-lg font-semibold text-white/80">
            {(open ?? 0) + 1} / {visible.length}
          </p>
        </div>
      ) : null}
    </Layout>
  );
}