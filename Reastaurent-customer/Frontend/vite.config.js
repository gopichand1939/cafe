import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:15020",
        changeOrigin: true,
      },
      "/images": {
        target: "http://localhost:15013",
        changeOrigin: true,
      },
    },
  },
});
