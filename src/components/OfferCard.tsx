import type { Accent, Offer } from "../data";

const bars: Record<Accent, string> = {
  pink: "bg-pink",
  sun: "bg-sun",
  leaf: "bg-leaf",
  royal: "bg-royal",
};

export default function OfferCard({ title, text, accent }: Offer) {
  return (
    <article className="h-full rounded-3xl border-2 border-white bg-ink p-6 sm:p-7">
      <div className={`mb-4 h-2 w-12 rounded-full ${bars[accent]}`} />
      <h3 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h3>
      <p className="mt-2 text-base leading-snug text-white/85 sm:text-lg">{text}</p>
    </article>
  );
}