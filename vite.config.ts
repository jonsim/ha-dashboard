import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/demo",
    emptyOutDir: true,
    assetsInlineLimit: 1_000_000,
  },
});
