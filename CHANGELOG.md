# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-04-22

### Changed
- **Package renamed to `panes-ui`** on npm (the bare `panes` name was unavailable). The IIFE global export is still `Panes`. Imports change from `"panes"` → `"panes-ui"` and `"panes/style.css"` → `"panes-ui/style.css"`.

### Added
- ARIA defaults: `role="dialog"`, `aria-modal="false"`, `aria-labelledby`, and `tabindex="-1"` are set on the pane root when the consumer hasn't set them.
- Cursor resets when the pointer leaves the pane (no more stuck resize cursors).
- `PaneManager` now renormalizes z-indexes when they climb past a threshold, so long-running sessions don't drift upward.
- `llms.txt` and `AGENTS.md` for AI/agent-assisted discovery.
- `SECURITY.md`, `CONTRIBUTING.md`, GitHub Actions CI + publish workflows, Dependabot.

### Fixed
- `layoutContent()` computed the content's bottom inset from the left inset. It now mirrors the top inset (symmetric vertical padding).
- `isOpen()` returned incorrect results for `position: fixed` panes because `offsetParent` is `null` for fixed elements in most browsers. Now uses `isConnected` + display state.
- `open()` fired `onOpen` even if the pane was already open — now fires only on state transition. Same for `close()`/`onClose`.
- `onWinResize` used viewport-rect coords to re-clamp position, which drifted absolutely-positioned panes. Now uses offset coords.
- Touch-scrolling inside `.pane-content` no longer blocked by a root-level `touch-action: none`. The drag-handle scope is unchanged.

## [1.0.0] — 2026-04-20

### Added
- Initial public release.
- TypeScript rewrite with full type definitions.
- Dual ESM + CommonJS builds, plus a minified IIFE (`Panes` global) for `<script>` use.
- `Pane`, `PaneManager`, `manager`, and `open()` exports.
- `getRect()` and `isOpen()` helpers.
- Defensive validation on `setPosition` / `setSize`, idempotent `destroy()`.
- Optional injectable `PaneManager` for isolated stacking contexts.
