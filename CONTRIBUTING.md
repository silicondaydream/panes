# Contributing

Thanks for your interest in `panes`! Bug reports, patches, and docs are all welcome.

## Development setup

Requires **Node 16+**.

```bash
git clone https://github.com/silicondaydream/panes.git
cd panes
npm install
npm run dev         # tsup --watch
npm run typecheck
npm run build
```

Open `examples/basic.html` after a build to smoke-test changes.

## Pull requests

1. Fork and branch from `main`.
2. Keep changes focused. One logical change per PR.
3. Run `npm run typecheck` and `npm run build` before pushing.
4. Add a line to `CHANGELOG.md` under an "Unreleased" section.
5. Open the PR and describe the problem and the fix.

## Non-negotiables

- **Zero runtime dependencies.**
- **No `innerHTML`.** Use `textContent` / `appendChild`.
- **Browser-only.** Construction must fail fast in Node.
- **No framework coupling.**

See [AGENTS.md](AGENTS.md) for more detail.

## Reporting bugs

Please include:

- Browser + version
- A minimal repro (CodePen / StackBlitz / plain HTML)
- Expected vs actual behavior

## License

By contributing, you agree your work will be released under the [MIT License](LICENSE).
