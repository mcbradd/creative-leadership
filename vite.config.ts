import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/creative-leadership/" : "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { main: "index.html", classroom: "classroom/index.html" },
    },
  },
}));
