import type { Pane } from "./pane.js";

export type PaneTarget = Element | string;

export type PaneCallback = (pane: Pane) => void;
export type PaneMoveCallback = (pane: Pane, left: number, top: number) => void;
export type PaneResizeCallback = (pane: Pane, width: number, height: number) => void;

export interface PaneOptions {
  /** Text or Element to insert into the titlebar. */
  title?: string | Element;
  /** Selector for the drag-handle element. Default `.pane-title`. */
  titleSelector?: string;
  /** Selector for the content element. Default `.pane-content`. */
  contentSelector?: string;
  /** Selector for the close-button element. Default `.pane-close`. */
  closeSelector?: string;
  /** Enable dragging the pane by its titlebar. Default `true`. */
  movable?: boolean;
  /** Enable resizing from edges/corners. Default `true`. */
  resizable?: boolean;
  /** Minimum width in px. Default `120`. */
  minWidth?: number;
  /** Minimum height in px. Default `80`. */
  minHeight?: number;
  /** Keep the pane inside the viewport. Default `true`. */
  constrain?: boolean;
  /** Center the pane on first `open()`. Default `true`. */
  center?: boolean;
  /** Pressing Escape calls `close()`. Default `true`. */
  closeOnEscape?: boolean;
  onOpen?: PaneCallback;
  onClose?: PaneCallback;
  onMove?: PaneMoveCallback;
  onResize?: PaneResizeCallback;
  onFocus?: PaneCallback;
}

export type ResizeEdge = "" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export type InteractionMode = "" | "drag" | "resize";
