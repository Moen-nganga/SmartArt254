import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
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
};

const path = window.location.pathname.replace(/\/$/, "") || "/";
const Page = routes[path] ?? Home;

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Page />
  </StrictMode>
);