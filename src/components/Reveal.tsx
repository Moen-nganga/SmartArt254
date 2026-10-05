import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type From = "left" | "right" | "up";

const hidden: Record<From, string> = {
  left: "-translate-x-20 opacity-0",
  right: "translate-x-20 opacity-0",
  up: "translate-y-14 opacity-0",
};

interface Props {
  children: ReactNode;
  from?: From;
  delay?: number;
  className?: string;
}

export default function Reveal({ children, from = "up", delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-x-0 translate-y-0 opacity-100" : hidden[from]
      } ${className}`}
    >
      {children}
    </div>
  );
}