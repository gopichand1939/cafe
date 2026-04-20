import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-core";
            }
            if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) {
              return "vendor-state";
            }
            if (
              id.includes("antd") ||
              id.includes("@mui") ||
              id.includes("react-icons") ||
              id.includes("@emotion")
            ) {
              return "vendor-ui";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/category": {
        target: "http://localhost:15013",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/items": {
        target: "http://localhost:15013",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/images": {
        target: "http://localhost:15013",
        changeOrigin: true,
      },
    },
  },
});
