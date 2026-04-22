import { defineConfig } from "tsup";

export default defineConfig([
  // Library entry — ESM + CJS + .d.ts
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2019",
    treeshake: true,
    outDir: "dist",
  },
  // Browser global build for <script> tag usage
  {
    entry: { panes: "src/index.ts" },
    format: ["iife"],
    globalName: "Panes",
    minify: true,
    sourcemap: true,
    target: "es2019",
    outDir: "dist",
    outExtension: () => ({ js: ".global.js" }),
  },
]);
