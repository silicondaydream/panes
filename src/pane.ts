import { manager as defaultManager, PaneManager } from "./manager.js";
import type {
  InteractionMode,
  PaneOptions,
  PaneTarget,
  ResizeEdge,
} from "./types.js";
import { assert, clamp, edgeAt, resolveEl, viewportBounds } from "./utils.js";

const RESIZE_EDGE = 6;
const DEFAULT_MIN_W = 120;
const DEFAULT_MIN_H = 80;

const CURSORS: Record<ResizeEdge, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  "": "",
};

let paneIdSeq = 0;

interface ResolvedOptions {
  titleSelector: string;
  contentSelector: string;
  closeSelector: string;
  movable: boolean;
  resizable: boolean;
  minWidth: number;
  minHeight: number;
  constrain: boolean;
  center: boolean;
  closeOnEscape: boolean;
  onOpen?: PaneOptions["onOpen"];
  onClose?: PaneOptions["onClose"];
  onMove?: PaneOptions["onMove"];
  onResize?: PaneOptions["onResize"];
  onFocus?: PaneOptions["onFocus"];
}

interface DragStart {
  x: number;
  y: number;
  left: number;
  top: number;
  w: number;
  h: number;
}

/**
 * A movable & resizable in-app modal pane.
 *
 * Construct with an existing element (or selector/id), then call `open()`
 * to display it. Listens to pointer events for unified mouse/touch/pen input.
 */
export class Pane {
  readonly el: HTMLElement;
  readonly title: HTMLElement | null;
  readonly content: HTMLElement | null;
  readonly closeBtn: HTMLElement | null;
  readonly opts: Readonly<ResolvedOptions>;

  private manager: PaneManager;
  private mode: InteractionMode = "";
  private edge: ResizeEdge = "";
  private pointerId: number | null = null;
  private start: DragStart | null = null;
  private rafId = 0;
  private pending: { x: number; y: number } | null = null;
  private destroyed = false;
  private visible = false;

  constructor(target: PaneTarget, opts: PaneOptions = {}, manager: PaneManager = defaultManager) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("[Panes] Pane can only be constructed in a browser environment");
    }
    this.el = resolveEl(target);
    this.manager = manager;

    this.opts = {
      titleSelector: opts.titleSelector ?? ".pane-title",
      contentSelector: opts.contentSelector ?? ".pane-content",
      closeSelector: opts.closeSelector ?? ".pane-close",
      movable: opts.movable !== false,
      resizable: opts.resizable !== false,
      minWidth: opts.minWidth ?? DEFAULT_MIN_W,
      minHeight: opts.minHeight ?? DEFAULT_MIN_H,
      constrain: opts.constrain !== false,
      center: opts.center !== false,
      closeOnEscape: opts.closeOnEscape !== false,
      onOpen: opts.onOpen,
      onClose: opts.onClose,
      onMove: opts.onMove,
      onResize: opts.onResize,
      onFocus: opts.onFocus,
    };

    assert(this.opts.minWidth > 0, "minWidth must be positive");
    assert(this.opts.minHeight > 0, "minHeight must be positive");

    this.el.classList.add("pane");
    this.title = this.el.querySelector<HTMLElement>(this.opts.titleSelector);
    this.content = this.el.querySelector<HTMLElement>(this.opts.contentSelector);
    this.closeBtn = this.el.querySelector<HTMLElement>(this.opts.closeSelector);

    if (opts.title != null && this.title) {
      if (typeof opts.title === "string") {
        this.title.textContent = opts.title;
      } else {
        this.title.textContent = "";
        this.title.appendChild(opts.title);
      }
    }

    this.applyAriaRoles();

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onHoverMove = this.onHoverMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onKey = this.onKey.bind(this);
    this.onWinResize = this.onWinResize.bind(this);
    this.onCloseClick = this.onCloseClick.bind(this);

    this.attach();
    this.manager.register(this);
    // Panes always start "not yet opened" — callers must invoke open() to
    // show them. This guarantees the first open() triggers centering and
    // fires onOpen, even when the stylesheet hides the element by default.
    this.visible = false;
  }

  private applyAriaRoles(): void {
    if (!this.el.hasAttribute("role")) this.el.setAttribute("role", "dialog");
    if (!this.el.hasAttribute("aria-modal")) this.el.setAttribute("aria-modal", "false");
    if (!this.el.hasAttribute("tabindex")) this.el.setAttribute("tabindex", "-1");
    if (this.title && !this.el.hasAttribute("aria-labelledby")) {
      if (!this.title.id) this.title.id = "pane-title-" + ++paneIdSeq;
      this.el.setAttribute("aria-labelledby", this.title.id);
    }
  }

  private attach(): void {
    const el = this.el;
    if (getComputedStyle(el).position === "static") el.style.position = "fixed";
    // Zero CSS margin so style.left/top equals visual position.
    el.style.margin = "0";

    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onHoverMove);
    el.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("resize", this.onWinResize);
    if (this.opts.closeOnEscape) document.addEventListener("keydown", this.onKey);
    if (this.closeBtn) this.closeBtn.addEventListener("click", this.onCloseClick);

    // Scope touch-action to the drag handle and any explicit resize edges so
    // the content area remains touch-scrollable. The stylesheet sets
    // `touch-action: none` on `.pane-title` by default.
    if (this.title && !this.title.style.touchAction) this.title.style.touchAction = "none";
  }

  /** Detach all listeners and remove this pane from its manager. Safe to call twice. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.el.removeEventListener("pointerdown", this.onPointerDown);
    this.el.removeEventListener("pointermove", this.onHoverMove);
    this.el.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("resize", this.onWinResize);
    document.removeEventListener("keydown", this.onKey);
    if (this.closeBtn) this.closeBtn.removeEventListener("click", this.onCloseClick);
    this.releaseCapture();
    this.manager.unregister(this);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  // ---- open / close ------------------------------------------------------

  open(): this {
    const wasHidden = !this.visible;
    this.el.style.display = "block";
    this.visible = true;
    this.layoutContent();
    if (wasHidden && this.opts.center) this.center();
    this.focus();
    if (wasHidden) this.opts.onOpen?.(this);
    return this;
  }

  close(): this {
    if (!this.visible) return this;
    this.el.style.display = "none";
    this.visible = false;
    this.opts.onClose?.(this);
    return this;
  }

  toggle(): this {
    return this.visible ? this.close() : this.open();
  }

  isOpen(): boolean {
    return this.visible && this.el.isConnected && this.el.style.display !== "none";
  }

  focus(): this {
    this.manager.raise(this);
    this.opts.onFocus?.(this);
    return this;
  }

  center(): this {
    const vb = viewportBounds();
    const r = this.el.getBoundingClientRect();
    // Convert viewport position to offsetParent's coord system so this works
    // for fixed and absolute panes alike.
    const dx = this.el.offsetLeft - r.left;
    const dy = this.el.offsetTop - r.top;
    this.setPosition(
      Math.max(0, (vb.w - r.width) / 2) + dx,
      Math.max(0, (vb.h - r.height) / 2) + dy,
    );
    return this;
  }

  setPosition(left: number, top: number): this {
    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      throw new Error("[Panes] setPosition requires finite numbers");
    }
    if (this.opts.constrain) {
      const vb = viewportBounds();
      const r = this.el.getBoundingClientRect();
      left = clamp(left, 0, Math.max(0, vb.w - r.width));
      top = clamp(top, 0, Math.max(0, vb.h - r.height));
    }
    this.el.style.left = left + "px";
    this.el.style.top = top + "px";
    this.opts.onMove?.(this, left, top);
    return this;
  }

  setSize(width: number, height: number): this {
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error("[Panes] setSize requires finite numbers");
    }
    width = Math.max(this.opts.minWidth, width);
    height = Math.max(this.opts.minHeight, height);
    this.el.style.width = width + "px";
    this.el.style.height = height + "px";
    this.layoutContent();
    this.opts.onResize?.(this, width, height);
    return this;
  }

  /** Current geometry in viewport coordinates. */
  getRect(): { left: number; top: number; width: number; height: number } {
    const r = this.el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  /**
   * If the content element is absolutely positioned (the common pattern for
   * layouts that anchor content under a titlebar), make its width/height
   * follow the pane. Insets are inferred from the content's own computed
   * top/left (mirrored to the opposite side), so users retain full control
   * over padding via CSS.
   */
  private layoutContent(): void {
    if (!this.content) return;
    const cs = getComputedStyle(this.content);
    if (cs.position !== "absolute" && cs.position !== "fixed") return;
    const top = parseFloat(cs.top) || 0;
    const left = parseFloat(cs.left) || 0;
    const w = this.el.clientWidth - left * 2;
    const h = this.el.clientHeight - top * 2;
    if (w > 0) this.content.style.width = w + "px";
    if (h > 0) this.content.style.height = h + "px";
  }

  // ---- event handlers ----------------------------------------------------

  private onCloseClick(evt: Event): void {
    evt.preventDefault();
    this.close();
  }

  private onKey(evt: KeyboardEvent): void {
    if (evt.key === "Escape" && this.isOpen()) this.close();
  }

  private onWinResize(): void {
    if (!this.opts.constrain || !this.visible) return;
    // Use offset coords so this works for absolute and fixed panes alike.
    this.setPosition(this.el.offsetLeft, this.el.offsetTop);
  }

  private onPointerDown(evt: PointerEvent): void {
    if (evt.pointerType === "mouse" && evt.button !== 0) return;

    this.focus();

    const rect = this.el.getBoundingClientRect();
    const edge = this.opts.resizable
      ? edgeAt(rect, evt.clientX, evt.clientY, RESIZE_EDGE)
      : "";

    const target = evt.target as Node | null;
    const draggable =
      this.opts.movable &&
      !!this.title &&
      (target === this.title || this.title.contains(target));

    if (edge) {
      this.mode = "resize";
      this.edge = edge;
    } else if (draggable) {
      this.mode = "drag";
    } else {
      return;
    }

    this.start = {
      x: evt.clientX,
      y: evt.clientY,
      left: this.el.offsetLeft,
      top: this.el.offsetTop,
      w: rect.width,
      h: rect.height,
    };
    this.pointerId = evt.pointerId;
    try {
      this.el.setPointerCapture(evt.pointerId);
    } catch {
      /* ignore — capture is best-effort */
    }
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);
    this.el.classList.add("pane--" + this.mode);
    evt.preventDefault();
  }

  private onHoverMove(evt: PointerEvent): void {
    if (this.mode || !this.opts.resizable) return;
    const rect = this.el.getBoundingClientRect();
    const edge = edgeAt(rect, evt.clientX, evt.clientY, RESIZE_EDGE);
    if (edge !== this.edge) {
      this.edge = edge;
      this.el.style.cursor = CURSORS[edge] || "";
    }
  }

  private onPointerLeave(): void {
    if (this.mode) return;
    this.edge = "";
    this.el.style.cursor = "";
  }

  private onPointerMove(evt: PointerEvent): void {
    if (!this.mode || evt.pointerId !== this.pointerId) return;
    this.pending = { x: evt.clientX, y: evt.clientY };
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      if (!this.pending || !this.mode) return;
      if (this.mode === "drag") this.applyDrag(this.pending);
      else this.applyResize(this.pending);
    });
  }

  private applyDrag(p: { x: number; y: number }): void {
    const s = this.start!;
    this.setPosition(s.left + (p.x - s.x), s.top + (p.y - s.y));
  }

  private applyResize(p: { x: number; y: number }): void {
    const s = this.start!;
    const e = this.edge;
    const dx = p.x - s.x;
    const dy = p.y - s.y;
    let left = s.left;
    let top = s.top;
    let w = s.w;
    let h = s.h;
    const minW = this.opts.minWidth;
    const minH = this.opts.minHeight;

    if (e.indexOf("e") !== -1) w = Math.max(minW, s.w + dx);
    if (e.indexOf("s") !== -1) h = Math.max(minH, s.h + dy);
    if (e.indexOf("w") !== -1) {
      w = Math.max(minW, s.w - dx);
      left = s.left + (s.w - w);
    }
    if (e.indexOf("n") !== -1) {
      h = Math.max(minH, s.h - dy);
      top = s.top + (s.h - h);
    }

    if (this.opts.constrain) {
      const vb = viewportBounds();
      if (left < 0) {
        w += left;
        left = 0;
      }
      if (top < 0) {
        h += top;
        top = 0;
      }
      if (left + w > vb.w) w = vb.w - left;
      if (top + h > vb.h) h = vb.h - top;
      w = Math.max(minW, w);
      h = Math.max(minH, h);
    }

    this.el.style.left = left + "px";
    this.el.style.top = top + "px";
    this.el.style.width = w + "px";
    this.el.style.height = h + "px";
    this.layoutContent();
    this.opts.onResize?.(this, w, h);
  }

  private onPointerUp(evt?: PointerEvent): void {
    if (evt && evt.pointerId !== this.pointerId) return;
    this.releaseCapture();
    if (this.mode) this.el.classList.remove("pane--" + this.mode);
    this.mode = "";
    this.edge = "";
    this.start = null;
    this.pending = null;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.el.style.cursor = "";
  }

  private releaseCapture(): void {
    if (this.pointerId != null) {
      try {
        this.el.releasePointerCapture(this.pointerId);
      } catch {
        /* ignore */
      }
    }
    this.pointerId = null;
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointercancel", this.onPointerUp);
  }
}

interface PaneElement extends HTMLElement {
  __pane?: Pane;
}

/**
 * Convenience: get-or-create a pane on an element and open it.
 * The instance is cached on the element so repeated calls return the same Pane.
 */
export function open(target: PaneTarget, opts?: PaneOptions): Pane {
  const el = resolveEl(target) as PaneElement;
  const inst = el.__pane ?? (el.__pane = new Pane(el, opts));
  return inst.open();
}
