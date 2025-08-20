import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://5.133.122.226:8000",
      "/ws": { target: "http://5.133.122.226:8000", ws: true },
    },
  },
});
