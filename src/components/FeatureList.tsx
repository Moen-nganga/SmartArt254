import { useState } from "react";
import type { Accent, Offer } from "../data";
import { link } from "../navigate";
import Reveal from "./Reveal";

const bars: Record<Accent, string> = {
  pink: "bg-pink",
  sun: "bg-sun",
  leaf: "bg-leaf",
  royal: "bg-royal",
};

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl border-2 border-dashed border-white/50 bg-ink/60 p-6 text-center text-lg text-white/70">
        Photo coming soon
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-full rounded-3xl object-cover"
    />
  );
}

interface Props {
  heading: string;
  intro: string;
  label: string;
  folder: string;
  offers: Offer[];
}

export default function FeatureList({ heading, intro, label, folder, offers }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-4 sm:px-10">
      <Reveal from="up">
        <h1 className="text-4xl font-extrabold sm:text-6xl">{heading}</h1>
        <p className="mt-3 max-w-2xl text-lg text-white/90 sm:text-xl">{intro}</p>
      </Reveal>

      <div className="mt-10 grid gap-14 sm:mt-14 sm:gap-24">
        {offers.map((o, i) => {
          const odd = i % 2 === 1;
          return (
            <article key={o.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-16">
              <Reveal
                from={odd ? "right" : "left"}
                className={`w-full max-w-md ${odd ? "md:order-2 md:justify-self-end" : ""}`}
              >
                <Photo src={`/images/${folder}/${slug(o.title)}.jpg`} alt={o.title} />
              </Reveal>
              <Reveal from={odd ? "left" : "right"} delay={150}>
                <div className={`h-2 w-12 rounded-full ${bars[o.accent]}`} />
                <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-white/70">{label}</p>
                <h2 className="mt-1 text-3xl font-extrabold leading-tight sm:text-5xl">{o.title}</h2>
                <p className="mt-4 max-w-md text-lg text-white/90 sm:text-xl">{o.text}</p>
                <a
                  href="/book"
                  onClick={link("/book")}
                  className="mt-6 inline-block rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink"
                >
                  Book this
                </a>
              </Reveal>
            </article>
          );
        })}
      </div>
    </section>
  );
}