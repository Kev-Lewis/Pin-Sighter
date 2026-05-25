import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Use the GitHub Pages base path for normal web builds.
// Keep "/" for Tauri so desktop asset paths do not break.
// @ts-expect-error process is a nodejs global
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

const base = isTauri ? "/" : "/";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  base,

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));