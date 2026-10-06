import type { ReactNode } from "react";

export default function Highlight({ children }: { children: ReactNode }) {
  return <span className="bg-[linear-gradient(transparent_78%,#fcc623_78%)]">{children}</span>;
}