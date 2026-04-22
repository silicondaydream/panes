# panes-ui

> Tiny, dependency-free **movable & resizable in-app modal panes** for the web — written in TypeScript, unified mouse/touch/pen input via Pointer Events.

[![npm](https://img.shields.io/npm/v/panes-ui.svg)](https://www.npmjs.com/package/panes-ui)
[![types](https://img.shields.io/npm/types/panes-ui.svg)](https://www.npmjs.com/package/panes-ui)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/panes-ui)](https://bundlephobia.com/package/panes-ui)

- ~5 KB min+gzip, **zero dependencies**
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
<link rel="stylesheet" href="https://unpkg.com/panes-ui/dist/pane.css" />
<script src="https://unpkg.com/panes-ui"></script>
<script>
  Panes.open("#my-pane", { title: "Hello" });
</script>
```

Pin a version for production: `https://unpkg.com/panes-ui@1.1.0/...`.

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
  import { onMount, onDestroy } from "svelte";
  import { Pane } from "panes";
  import "panes/style.css";

  let el: HTMLDivElement;
  let pane: Pane;

  onMount(() => { pane = new Pane(el, { title: "Report" }).open(); });
  onDestroy(() => pane?.destroy());
</script>

<div bind:this={el} style="width:420px;height:300px">
  <div class="pane-title" />
  <button class="pane-close" aria-label="Close">×</button>
  <div class="pane-content"><slot /></div>
</div>
```

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

### Stacking — `PaneManager`

A singleton `manager` assigns z-index. Calling `focus()` (or any pointerdown on a pane) raises it to the top. For isolated stacking, construct your own:

```ts
import { Pane, PaneManager } from "panes-ui";
const myManager = new PaneManager();
const p = new Pane("#a", {}, myManager);
```

z-index values are automatically rebased when they grow large, so long sessions don't drift upward.

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
