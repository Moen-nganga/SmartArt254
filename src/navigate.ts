import type { MouseEvent } from "react";

export function go(path: string) {
  window.location.href = path;
}

export function link(path: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    go(path);
  };
}