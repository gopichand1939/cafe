import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/category": {
        target: "http://localhost:15013",
        changeOrigin: true,
      },
      "/items": {
        target: "http://localhost:15013",
        changeOrigin: true,
      },
      "/images": {
        target: "http://localhost:15013",
        changeOrigin: true,
      },
    },
  },
});
