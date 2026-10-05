import type { ReactNode } from "react";
import type { Offer } from "../data";
import OfferCard from "./OfferCard";
import { link } from "../navigate";

interface Props {
  heading: string;
  intro: string;
  offers: Offer[];
  cta?: boolean;
  children?: ReactNode;
}

export default function Section({ heading, intro, offers, cta = true, children }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-10">
      <h2 className="text-3xl font-bold sm:text-4xl">{heading}</h2>
      <p className="mt-2 max-w-xl text-base text-white/85 sm:text-lg">{intro}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => (
          <OfferCard key={o.title} {...o} />
        ))}
      </div>
      {children}
      {cta && (
        <a
          href="/book"
          onClick={link("/book")}
          className="mt-7 inline-block rounded-full bg-sun px-7 py-3 text-lg font-bold text-ink"
        >
          Book an activity
        </a>
      )}
    </section>
  );
}