import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  label: string;
  poster?: string;
  className?: string;
}

export default function AutoVideo({ src, label, poster, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const attempt = el.play();
          if (attempt) attempt.catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [failed]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-3xl border-2 border-dashed border-white/50 bg-ink/60 p-6 text-center text-lg text-white/70 ${className}`}
      >
        Video coming soon
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      controlsList="nodownload noplaybackrate noremoteplayback"
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      onError={() => setFailed(true)}
      className={`pointer-events-none rounded-3xl object-cover ${className}`}
    />
  );
}