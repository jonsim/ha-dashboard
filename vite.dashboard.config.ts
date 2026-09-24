import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    assetsInlineLimit: 1_000_000,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "ha-dashboard.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
