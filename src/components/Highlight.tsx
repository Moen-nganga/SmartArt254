import type { ReactNode } from "react";

export default function Highlight({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-sun/60 px-1.5 [box-decoration-break:clone]">{children}</span>;
}