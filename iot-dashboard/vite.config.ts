import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // server: {
  //   host: "0.0.0.0",  // required inside Docker
  //   port: 5173,
  //   proxy: {
  //     // Local dev only — Nginx handles this in Docker
  //     "/api": {
  //       target: "http://localhost:8000",
  //       changeOrigin: true,
  //       rewrite: (p) => p.replace(/^\/api/, ""),
  //     },
  //   },
})
