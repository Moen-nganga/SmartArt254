import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { getToken, isNative, setToken } from "./native";
import AppShell, { tabPaths } from "./components/AppShell";
import Home from "./pages/Home";
import Schools from "./pages/Schools";
import Workshops from "./pages/Workshops";
import Events from "./pages/Events";
import Book from "./pages/Book";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Blog from "./pages/Blog";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Member from "./pages/Member";
import Talk from "./pages/Talk";
import Highlights from "./pages/Highlights";

const routes: Record<string, () => JSX.Element> = {
  "/": Home,
  "/schools": Schools,
  "/workshops": Workshops,
  "/events": Events,
  "/book": Book,
  "/privacy": Privacy,
  "/terms": Terms,
  "/blog": Blog,
  "/signin": SignIn,
  "/signup": SignUp,
  "/member": Member,
  "/talk": Talk,
  "/highlights": Highlights,
};

const openInApp = ["/signin", "/signup", "/privacy", "/terms"];

const path = window.location.pathname.replace(/\/$/, "") || "/";
const Page = routes[path] ?? Home;
const needsSignIn = isNative && !openInApp.includes(path);

function toSignIn() {
  window.location.replace(`/signin?next=${encodeURIComponent(path)}`);
}

function checkSession() {
  fetch("/api/auth?action=me")
    .then((res) => {
      if (res.status === 401) {
        setToken(null);
        toSignIn();
      }
    })
    .catch(() => {});
}

if (needsSignIn && !getToken()) {
  toSignIn();
} else {
  if (needsSignIn) checkSession();
  const useShell = isNative && Boolean(getToken()) && tabPaths.includes(path);
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>{useShell ? <AppShell initialPath={path} /> : <Page />}</StrictMode>
  );
}