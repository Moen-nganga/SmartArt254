import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function Photo({ src, alt, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-3xl border-2 border-dashed border-white/50 bg-ink/60 p-6 text-center text-lg text-white/70 ${className}`}
      >
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
      className={`rounded-3xl object-cover ${className}`}
    />
  );
}