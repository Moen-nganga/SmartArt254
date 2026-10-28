import { useContext } from "react";
import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ShellContext } from "./ShellContext";
import { getToken, isNative } from "../native";
import { link } from "../navigate";

export default function Layout({ children }: { children: ReactNode }) {
  const inShell = useContext(ShellContext);
  const signedIn = Boolean(getToken());

  const brand = (
    <>
      Smart<span className="text-pink">Art</span>254
    </>
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {inShell ? null : isNative ? (
        <header className="w-full border-b border-ink/15 px-5 py-5 sm:px-10 sm:py-7">
          {signedIn ? (
            <a href="/" onClick={link("/")} className="text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">
              {brand}
            </a>
          ) : (
            <span className="text-4xl font-extrabold leading-none tracking-tight sm:text-6xl">{brand}</span>
          )}
        </header>
      ) : (
        <Navbar />
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}