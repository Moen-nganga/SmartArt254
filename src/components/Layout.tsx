import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="mx-auto w-full max-w-5xl px-5 py-8 text-sm text-white/70">
        SmartArt254. Hands-on art across Kenya.
      </footer>
    </div>
  );
}