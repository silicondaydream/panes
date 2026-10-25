# panes-ui

> Tiny, dependency-free **movable & resizable in-app modal panes** for the web — written in TypeScript, unified mouse/touch/pen input via Pointer Events.

[![npm](https://img.shields.io/npm/v/panes-ui.svg)](https://www.npmjs.com/package/panes-ui)
[![types](https://img.shields.io/npm/types/panes-ui.svg)](https://www.npmjs.com/package/panes-ui)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/panes-ui)](https://bundlephobia.com/package/panes-ui)
[![CI](https://github.com/silicondaydream/panes/actions/workflows/ci.yml/badge.svg)](https://github.com/silicondaydream/panes/actions/workflows/ci.yml)

**[Live demo & docs →](https://silicondaydream.github.io/panes/)**

- ~3.5 KB min+gzip, **zero dependencies**
- Works with **mouse, touch, and pen** via [Pointer Events](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- Ships **ESM + CJS + IIFE** with `.d.ts` types
- Framework-agnostic — drop-in for **plain HTML, React, Vue, Svelte, Solid, Angular**
- Accessible: `role="dialog"` + `aria-labelledby` wiring, keyboard close
- `requestAnimationFrame`-coalesced drag/resize, pointer capture, and proper teardown

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Quickstart](#quickstart)
- [CDN (no build step)](#cdn-no-build-step)
- [Framework examples](#framework-examples)
- [DOM contract](#dom-contract)
- [API](#api)
- [Recipes](#recipes)
- [Behavior notes](#behavior-notes)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [Browser support](#browser-support)
- [Building from source](#building-from-source)
- [Security](#security)
- [Changelog](CHANGELOG.md)
- [License](#license)

---

> The package is named **`panes-ui`** on npm (the bare name `panes` was taken). The JavaScript global exposed by the CDN/IIFE build is still `Panes`.

## Prerequisites

`panes-ui` is a **browser-only** library.

| Requirement  | Minimum                                                             |
| ------------ | ------------------------------------------------------------------- |
| Runtime      | Any modern browser with [Pointer Events](https://caniuse.com/pointer) (Chrome 55+, Firefox 59+, Safari 13+, Edge 79+) |
| Node (build) | Node 16+ (only needed if you consume via a bundler)                 |
| TypeScript   | 4.5+ (optional; JS works fine)                                      |

There is **no SSR runtime** — construct panes from browser code (`useEffect`, `onMount`, etc. in frameworks).

---

## Install

```bash
npm install panes-ui
# or
pnpm add panes-ui
# or
yarn add panes-ui
```

This installs both the JavaScript and the types. Also import the stylesheet once:

```ts
import "panes-ui/style.css";
```

If your bundler doesn't handle CSS imports, copy `node_modules/panes-ui/dist/pane.css` into your static assets and link it with a `<link rel="stylesheet">`.

---

## Quickstart

### 1. Add markup

```html
<div id="my-pane" style="width:360px;height:240px">
  <div class="pane-title">Hello</div>
  <button class="pane-close" aria-label="Close">&times;</button>
  <div class="pane-content">
    Drag my titlebar. Resize from any edge or corner. Touch works too.
  </div>
</div>
```

### 2. Import and open

```ts
import { Pane } from "panes-ui";
import "panes-ui/style.css";

const pane = new Pane("#my-pane", { title: "Hello" });
pane.open();
```

Or use the one-line shortcut:

```ts
import { open } from "panes-ui";
open("#my-pane", { title: "Hello" }); // lazy-creates + opens
```

---

## CDN (no build step)

```html
<link rel="stylesheet" href="https://unpkg.com/panes-ui@1/dist/pane.css" />
<script src="https://unpkg.com/panes-ui@1"></script>
<script>
  Panes.open("#my-pane", { title: "Hello" });
</script>
```

The IIFE build exposes everything on the `Panes` global (`Panes.Pane`, `Panes.open`, `Panes.manager`, …). For production, pin an exact version (e.g. `panes-ui@1.1.1`) and consider adding an [`integrity`](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) attribute. jsDelivr works too: `https://cdn.jsdelivr.net/npm/panes-ui@1`.

---

## Framework examples

### React

```tsx
import { useEffect, useRef } from "react";
import { Pane } from "panes-ui";
import "panes-ui/style.css";

export function MyModal({ open }: { open: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const paneRef = useRef<Pane | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    paneRef.current = new Pane(ref.current, { title: "Report" });
    return () => paneRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (!paneRef.current) return;
    open ? paneRef.current.open() : paneRef.current.close();
  }, [open]);

  return (
    <div ref={ref} style={{ width: 420, height: 300 }}>
      <div className="pane-title" />
      <button className="pane-close" aria-label="Close">×</button>
      <div className="pane-content">…</div>
    </div>
  );
}
```

### Vue 3

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { Pane } from "panes-ui";
import "panes-ui/style.css";

const root = ref<HTMLDivElement>();
let pane: Pane | null = null;

onMounted(() => { if (root.value) pane = new Pane(root.value, { title: "Report" }).open(); });
onBeforeUnmount(() => pane?.destroy());
</script>

<template>
  <div ref="root" style="width:420px;height:300px">
    <div class="pane-title" />
    <button class="pane-close" aria-label="Close">×</button>
    <div class="pane-content"><slot /></div>
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { Pane } from "panes-ui";
  import "panes-ui/style.css";

  let el: HTMLDivElement;

  onMount(() => {
    const pane = new Pane(el, { title: "Report" }).open();
    return () => pane.destroy();
  });
</script>

<div bind:this={el} style="width:420px;height:300px">
  <div class="pane-title"></div>
  <button class="pane-close" aria-label="Close">×</button>
  <div class="pane-content"><slot /></div>
</div>
```

### Solid

```tsx
import { onCleanup, onMount } from "solid-js";
import { Pane } from "panes-ui";
import "panes-ui/style.css";

export function Report() {
  let el!: HTMLDivElement;
  onMount(() => {
    const pane = new Pane(el, { title: "Report" }).open();
    onCleanup(() => pane.destroy());
  });
  return (
    <div ref={el} style={{ width: "420px", height: "300px" }}>
      <div class="pane-title" />
      <button class="pane-close" aria-label="Close">×</button>
      <div class="pane-content">…</div>
    </div>
  );
}
```

### Next.js / SSR

Importing `panes-ui` on the server is safe — only *constructing* a `Pane` needs `window`/`document`, and it throws a clear error if you try it outside a browser. In the App Router, put the component in a `"use client"` file and create the pane in `useEffect`, as in the React example.

---

## DOM contract

Any element can become a pane. Its optional children are discovered by selector:

| Selector         | Role                                               |
| ---------------- | -------------------------------------------------- |
| `.pane-title`    | Drag handle. Click-and-drag here to move the pane. |
| `.pane-content`  | Scrollable body. Text is selectable.               |
| `.pane-close`    | Element (usually a `<button>`) that closes it.     |

Selectors are configurable per instance (see `titleSelector`, `contentSelector`, `closeSelector`).

The pane element must have a non-static position. Panes defaults to `position: fixed` if the element is statically positioned.

---

## API

### `new Pane(target, options?, manager?)`

- `target` — an `Element`, an element `id`, or a CSS selector.
- `options` — see below.
- `manager` — an optional [`PaneManager`](#stacking--panemanager) for isolated stacking contexts.

```ts
interface PaneOptions {
  title?: string | Element;
  titleSelector?: string;     // default ".pane-title"
  contentSelector?: string;   // default ".pane-content"
  closeSelector?: string;     // default ".pane-close"
  movable?: boolean;          // default true
  resizable?: boolean;        // default true
  minWidth?: number;          // default 120
  minHeight?: number;         // default 80
  constrain?: boolean;        // default true — keep inside viewport
  center?: boolean;           // default true — center on first open()
  closeOnEscape?: boolean;    // default true
  onOpen?:   (pane: Pane) => void;
  onClose?:  (pane: Pane) => void;
  onMove?:   (pane: Pane, left: number, top: number) => void;
  onResize?: (pane: Pane, width: number, height: number) => void;
  onFocus?:  (pane: Pane) => void;
}
```

### Methods

| Method                            | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `open()`                          | Show the pane (centers on first open).           |
| `close()`                         | Hide the pane.                                   |
| `toggle()`                        | Open if hidden, close if visible.                |
| `isOpen()`                        | Whether the pane is currently visible.           |
| `focus()`                         | Raise above other panes.                         |
| `center()`                        | Re-center in the viewport.                       |
| `setPosition(left, top)`          | Move the pane (respects `constrain`).            |
| `setSize(width, height)`          | Resize the pane (respects min sizes).            |
| `getRect()`                       | Current viewport-relative geometry.              |
| `destroy()`                       | Detach listeners and unregister. Idempotent.     |

Methods that change state (`open`, `close`, `toggle`, `focus`, `center`, `setPosition`, `setSize`) return the pane, so calls chain: `pane.setSize(400, 300).center().open()`.

`setPosition()` takes coordinates in the pane's offset parent (the viewport, for the default `position: fixed`). `getRect()` returns viewport coordinates.

### Instance properties

| Property    | Type                    | Description                                  |
| ----------- | ----------------------- | -------------------------------------------- |
| `el`        | `HTMLElement`           | The pane root.                               |
| `title`     | `HTMLElement \| null`   | The element matched by `titleSelector`.      |
| `content`   | `HTMLElement \| null`   | The element matched by `contentSelector`.    |
| `closeBtn`  | `HTMLElement \| null`   | The element matched by `closeSelector`.      |
| `opts`      | `Readonly<…>`           | The resolved options (defaults filled in).   |

### Other exports

| Export                     | Description                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `open(target, options?)`   | Get-or-create a pane on the element and open it. The instance is cached on the element, so `options` only apply on the first call. |
| `manager`                  | The default `PaneManager` singleton.                                                                     |
| `PaneManager`              | Class for an isolated stacking context (see below). `list()` returns a snapshot of registered panes.     |
| `version`                  | The library version string.                                                                              |
| Types                      | `PaneOptions`, `PaneTarget`, `PaneCallback`, `PaneMoveCallback`, `PaneResizeCallback`, `ResizeEdge`, `InteractionMode`. |

### Stacking — `PaneManager`

A singleton `manager` assigns z-index. Calling `focus()` (or any pointerdown on a pane) raises it to the top. For isolated stacking, construct your own:

```ts
import { Pane, PaneManager } from "panes-ui";
const myManager = new PaneManager();
const p = new Pane("#a", {}, myManager);
```

z-index values start at 1001 and are automatically rebased when they grow large, so long sessions don't drift upward. If other UI on your page (toasts, menus) needs to sit above panes, give it a z-index above 10000.

---

## Recipes

### Remember position and size

```ts
const KEY = "pane:inspector";
const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
const save = (p: Pane) => localStorage.setItem(KEY, JSON.stringify(p.getRect()));

const pane = new Pane("#inspector", {
  center: !saved,   // only center when there's nothing to restore
  onMove: save,
  onResize: save,
}).open();          // open first: a hidden pane measures 0×0
if (saved) pane.setSize(saved.width, saved.height).setPosition(saved.left, saved.top);
```

### Close only the front-most pane on Escape

By default, every open pane with `closeOnEscape` closes when Escape is pressed. To close one at a time:

```ts
import { Pane, manager } from "panes-ui";

const a = new Pane("#a", { closeOnEscape: false });
const b = new Pane("#b", { closeOnEscape: false });

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const top = manager.list()
    .filter((p) => p.isOpen())
    .sort((x, y) => +y.el.style.zIndex - +x.el.style.zIndex)[0];
  top?.close();
});
```

### Spawn panes dynamically

```ts
function spawn(title: string, body: Node) {
  const el = document.createElement("div");
  el.style.cssText = "width:320px;height:200px";
  const t = el.appendChild(document.createElement("div"));
  t.className = "pane-title";
  const c = el.appendChild(document.createElement("div"));
  c.className = "pane-content";
  c.appendChild(body);
  document.body.appendChild(el);

  return new Pane(el, {
    title,
    onClose: (p) => { p.destroy(); el.remove(); }, // one-shot pane
  }).open();
}
```

### Custom markup

```ts
new Pane("#win", {
  titleSelector: ".win-header",
  contentSelector: ".win-body",
  closeSelector: "[data-close]",
});
```

### A true modal

Panes are non-blocking (`aria-modal="false"`). For a blocking dialog, render a backdrop behind the pane, set `aria-modal="true"` on the element yourself (the library won't overwrite it), and trap focus inside — or use the native [`<dialog>`](https://developer.mozilla.org/docs/Web/HTML/Element/dialog) element.

---

## Behavior notes

- **Panes start hidden.** Call `open()` to show one; the first `open()` centers it (unless `center: false`) and fires `onOpen`.
- **Positioning.** A statically positioned element is switched to `position: fixed`, and its CSS `margin` is zeroed so `left`/`top` match the visual position. Geometry is written as inline `left`/`top`/`width`/`height`.
- **Drag & resize.** Dragging starts only from the title element; resizing from a 6px band along any edge or corner. Right/middle mouse buttons are ignored.
- **Absolutely positioned content.** If `.pane-content` is `position: absolute`, its width/height are kept in sync with the pane, mirroring its own `top`/`left` as bottom/right insets.
- **Callbacks.** `onMove` fires for every position change (drag frames, `setPosition`, `center`, window-resize re-clamping). `onResize` fires during resize gestures and on `setSize`. `onOpen`/`onClose` fire only on actual state changes.
- **Cleanup.** `destroy()` removes every listener the pane added (including on `window`/`document`), but leaves the element and its inline styles in place.

---

## Styling

Import `panes-ui/style.css` for the default look, or write your own — the library only reads geometry, never your colors.

Interactive state is exposed as classes on the root element:

| Class            | When                       |
| ---------------- | -------------------------- |
| `.pane`          | Always, after construction |
| `.pane--drag`    | During a drag              |
| `.pane--resize`  | During a resize            |

---

## Accessibility

`panes-ui` sets the following on the root on construction (unless you've set them yourself):

- `role="dialog"`
- `aria-modal="false"` — panes are *non-blocking* in-app windows, not modal dialogs. If you want a true modal, implement a backdrop + focus trap above it.
- `tabindex="-1"` — allows programmatic focus
- `aria-labelledby` — wired to the title element when one exists

Escape key closes the pane (disable via `closeOnEscape: false`).

---

## Browser support

Chrome 55+, Firefox 59+, Safari 13+, Edge 79+ (anything with Pointer Events). No IE support.

---

## Building from source

```bash
git clone https://github.com/silicondaydream/panes.git
cd panes
npm install
npm run build      # ESM + CJS + IIFE + .d.ts in dist/
npm run typecheck
```

---

## Security

- `panes-ui` never executes user-supplied strings, never evaluates event-handler strings, and never injects HTML. `options.title` is set via `textContent` / `appendChild`, not `innerHTML`.
- If you embed user-generated content inside `.pane-content`, **you** are responsible for sanitizing it.
- The library does not make any network requests.

Found a vulnerability? See [SECURITY.md](SECURITY.md).

---

## Why this library

- **Pointer Events** — one unified code path for mouse, touch, and pen.
- **`requestAnimationFrame` coalescing** — drag/resize stays smooth under load.
- **Pointer capture** — no lost drags when the cursor leaves the pane.
- **Viewport constraints on resize + window-resize reflow** — panes can't get stranded off-screen.
- **Proper teardown** (`destroy()`) — no leaked listeners.
- **Keyboard**: Escape closes; close button is focusable.
- **Defensive errors**: descriptive throws on bad input.
- **TypeScript** types out of the box.

---

## License

[MIT](LICENSE) © Chris Adams
