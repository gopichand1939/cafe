/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cafe: {
          bg: "#0f0c29",
          panel: "rgba(255,255,255,0.04)",
          panelStrong: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.08)",
          muted: "rgba(255,255,255,0.45)",
        },
      },
      boxShadow: {
        glow: "0 12px 40px rgba(0,0,0,0.3)",
        warm: "0 10px 30px rgba(245,158,11,0.22)",
      },
      animation: {
        "customer-overlay-in": "customerOverlayFadeIn 220ms ease-out",
        "customer-drawer-in": "customerDrawerSlideIn 260ms ease-out",
      },
      keyframes: {
        customerOverlayFadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        customerDrawerSlideIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
