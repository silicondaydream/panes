import type { Pane } from "./pane.js";

const Z_BASE = 1000;
const Z_RENORMALIZE_AT = 10_000;

/**
 * Tracks active panes so that focusing one raises it above the others.
 * A singleton instance is exported as `manager`, but you can construct
 * your own to get an isolated stacking context.
 */
export class PaneManager {
  private panes: Pane[] = [];
  private top: number = Z_BASE;

  register(pane: Pane): void {
    if (this.panes.indexOf(pane) === -1) this.panes.push(pane);
    this.raise(pane);
  }

  unregister(pane: Pane): void {
    const i = this.panes.indexOf(pane);
    if (i !== -1) this.panes.splice(i, 1);
  }

  raise(pane: Pane): void {
    if (this.top >= Z_RENORMALIZE_AT) this.renormalize();
    this.top += 1;
    pane.el.style.zIndex = String(this.top);
  }

  /** Snapshot of currently registered panes. */
  list(): readonly Pane[] {
    return this.panes.slice();
  }

  /**
   * Rebase z-indexes to keep them bounded under long sessions with many
   * focus changes. Preserves current stacking order.
   */
  private renormalize(): void {
    const ordered = this.panes
      .map((p) => ({ p, z: parseInt(p.el.style.zIndex, 10) || Z_BASE }))
      .sort((a, b) => a.z - b.z);
    this.top = Z_BASE;
    for (const { p } of ordered) {
      this.top += 1;
      p.el.style.zIndex = String(this.top);
    }
  }
}

export const manager = new PaneManager();
