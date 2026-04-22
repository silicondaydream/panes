import type { ResizeEdge } from "./types.js";

export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error("[Panes] " + msg);
}

export function resolveEl(target: Element | string): HTMLElement {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error("[Panes] cannot resolve a selector outside the browser");
    }
    const byId =
      target.startsWith("#") || /^[A-Za-z][\w-]*$/.test(target)
        ? document.getElementById(target.replace(/^#/, ""))
        : null;
    const el = byId ?? document.querySelector(target);
    assert(el, `element not found: "${target}"`);
    assert(el instanceof HTMLElement, `target must be an HTMLElement: "${target}"`);
    return el;
  }
  assert(
    target && (target as Element).nodeType === 1,
    "target must be an Element, id, or CSS selector",
  );
  assert(target instanceof HTMLElement, "target must be an HTMLElement");
  return target;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export interface ViewportBounds {
  w: number;
  h: number;
}

export function viewportBounds(): ViewportBounds {
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight,
  };
}

/** Detect which resize handle (if any) the pointer is over. */
export function edgeAt(
  rect: DOMRect,
  px: number,
  py: number,
  edge: number,
): ResizeEdge {
  let rm = "";
  if (py < rect.top + edge) rm = "n";
  else if (py > rect.bottom - edge) rm = "s";
  if (px < rect.left + edge) rm += "w";
  else if (px > rect.right - edge) rm += "e";
  return rm as ResizeEdge;
}
