import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || "http://localhost:15020";
  const imageProxyTarget =
    env.VITE_DEV_IMAGE_PROXY_TARGET || "http://localhost:15013";

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
              if (id.includes("axios")) {
                return "vendor-axios";
              }
            }
          },
        },
      },
    },
    server: {
      port: 5174,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/images": {
          target: imageProxyTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
