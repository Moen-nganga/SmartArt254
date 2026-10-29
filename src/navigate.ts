import type { MouseEvent } from "react";

export function go(path: string) {
  window.location.href = path;
}

export function link(path: string) {
  return (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(path);
  };
}