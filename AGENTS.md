# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

## Project summary

`panes` is a zero-dependency TypeScript library that turns any `<div>` into a movable, resizable, in-app pane. It uses Pointer Events for unified mouse/touch/pen input, ships ESM + CJS + IIFE builds, and has no runtime dependencies.

## Repo layout

```
src/
  index.ts      # public exports
  pane.ts       # Pane class + open() shortcut
  manager.ts    # PaneManager (z-index stacking)
  utils.ts      # small pure helpers
  types.ts      # public TypeScript types
  pane.css      # default styles (copied to dist/ as-is)
examples/
  basic.html    # plain-HTML demo using the IIFE build
dist/           # build output — DO NOT edit by hand
```

## Build

```bash
npm install
npm run build      # dist/index.{js,cjs,d.ts} + dist/panes.global.js + dist/pane.css
npm run typecheck
```

Build is driven by `tsup.config.ts`. The CSS file is copied verbatim (no preprocessing).

## Constraints / conventions

- **No runtime dependencies.** Do not add any; it's a hard product requirement.
- **Browser-only.** Guard any `window`/`document` access so construction fails fast when run in Node.
- **No innerHTML.** Ever. User-provided strings are inserted via `textContent`. User-provided elements via `appendChild`.
- **No external CSS frameworks.** Pane geometry is set inline; visual design is in `pane.css` and can be overridden.
- **Keep the API surface small.** New options need a real use case; prefer callbacks (`onMove` etc.) over extending state.
- **Target `es2019`** per `tsup.config.ts`; do not use syntax that requires transpilation beyond that.
- **Class list**: `.pane`, `.pane--drag`, `.pane--resize` are the only public class hooks the library writes.
- **Selectors**: default `.pane-title`, `.pane-content`, `.pane-close` — configurable per instance, never global.
- **Accessibility defaults**: `role="dialog"`, `aria-modal="false"`, `aria-labelledby`, `tabindex="-1"` are applied only if the user hasn't set them. Don't overwrite user intent.

## Safe changes

- Bug fixes, performance work, new tests, docs.
- Adding optional callback hooks (`onX`) with sensible defaults.

## Changes that require discussion first

- Anything that introduces a dependency, peer or otherwise.
- Changing default behavior (e.g. flipping `constrain`, `center`, `closeOnEscape`).
- Breaking the DOM contract or class names.
- Anything that would force the library to depend on a framework.

## Release

1. Update `CHANGELOG.md`.
2. Bump `version` in `package.json` and `src/index.ts`.
3. `npm run build` — verify `dist/` contents.
4. `npm publish` (CI runs `prepublishOnly` → build).
