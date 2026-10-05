import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Home from "./pages/Home";
import Schools from "./pages/Schools";
import Workshops from "./pages/Workshops";
import Events from "./pages/Events";
import Book from "./pages/Book";

const routes: Record<string, () => JSX.Element> = {
  "/": Home,
  "/schools": Schools,
  "/workshops": Workshops,
  "/events": Events,
  "/book": Book,
};

const path = window.location.pathname.replace(/\/$/, "") || "/";
const Page = routes[path] ?? Home;

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Page />
  </StrictMode>
);