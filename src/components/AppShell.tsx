import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import Home from "../pages/Home";
import Schools from "../pages/Schools";
import Workshops from "../pages/Workshops";
import Events from "../pages/Events";
import Blog from "../pages/Blog";
import Book from "../pages/Book";
import Talk from "../pages/Talk";
import Member from "../pages/Member";
import { ShellContext } from "./ShellContext";

function TabIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

interface Tab {
  path: string;
  label: string;
  Page: () => JSX.Element;
  icon: ReactNode;
}

const tabs: Tab[] = [
  {
    path: "/",
    label: "Home",
    Page: Home,
    icon: (
      <TabIcon>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </TabIcon>
    ),
  },
  {
    path: "/schools",
    label: "Schools",
    Page: Schools,
    icon: (
      <TabIcon>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </TabIcon>
    ),
  },
  {
    path: "/workshops",
    label: "Workshops",
    Page: Workshops,
    icon: (
      <TabIcon>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </TabIcon>
    ),
  },
  {
    path: "/events",
    label: "Events",
    Page: Events,
    icon: (
      <TabIcon>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </TabIcon>
    ),
  },
  {
    path: "/blog",
    label: "Blog",
    Page: Blog,
    icon: (
      <TabIcon>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </TabIcon>
    ),
  },
  {
    path: "/book",
    label: "Book",
    Page: Book,
    icon: (
      <TabIcon>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </TabIcon>
    ),
  },
  {
    path: "/talk",
    label: "Talk",
    Page: Talk,
    icon: (
      <TabIcon>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </TabIcon>
    ),
  },
  {
    path: "/member",
    label: "Account",
    Page: Member,
    icon: (
      <TabIcon>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </TabIcon>
    ),
  },
];

export const tabPaths = tabs.map((t) => t.path);

export default function AppShell({ initialPath }: { initialPath: string }) {
  const start = Math.max(0, tabPaths.indexOf(initialPath));
  const [index, setIndex] = useState(start);
  const [keyboard, setKeyboard] = useState(false);
  const pager = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = pager.current;
    if (el) el.scrollLeft = start * el.clientWidth;
  }, [start]);

  useEffect(() => {
    window.history.replaceState(null, "", tabs[index].path);
  }, [index]);

  useEffect(() => {
    const nav = bar.current;
    const button = nav?.children[index] as HTMLElement | undefined;
    if (!nav || !button) return;
    nav.scrollTo({
      left: button.offsetLeft - (nav.clientWidth - button.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [index]);

  useEffect(() => {
    let full = window.innerHeight;
    const onResize = () => {
      if (window.innerHeight > full) full = window.innerHeight;
      setKeyboard(window.innerHeight < full * 0.75);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onScroll = () => {
    const el = pager.current;
    if (!el || !el.clientWidth) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((current) => (current === next ? current : next));
  };

  const goTo = useCallback(
    (target: number) => {
      const el = pager.current;
      if (!el) return;
      if (target === index) {
        (el.children[target] as HTMLElement | undefined)?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const left = target * el.clientWidth;
      if (Math.abs(target - index) > 1) el.scrollLeft = left;
      else el.scrollTo({ left, behavior: "smooth" });
    },
    [index]
  );

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as Element).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href) return;
    const target = tabPaths.indexOf(href);
    if (target === -1) return;
    e.preventDefault();
    e.stopPropagation();
    goTo(target);
  };

  return (
    <ShellContext.Provider value={true}>
      <div
        className="fixed inset-0 flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        onClickCapture={onClickCapture}
      >
        <div
          ref={pager}
          onScroll={onScroll}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab, i) => (
            <div
              key={tab.path}
              aria-hidden={i !== index}
              className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain [&_.min-h-screen]:min-h-full"
            >
              {Math.abs(i - index) <= 1 ? <tab.Page /> : null}
            </div>
          ))}
        </div>

        {!keyboard && (
          <nav
            ref={bar}
            aria-label="Main"
            className="relative flex shrink-0 overflow-x-auto border-t border-ink/15 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab.path}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "page" : undefined}
                className={`flex min-w-[4.75rem] flex-1 flex-col items-center gap-1 px-2 py-2.5 text-xs font-bold transition ${
                  i === index ? "text-pink" : "text-ink/70"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </ShellContext.Provider>
  );
}