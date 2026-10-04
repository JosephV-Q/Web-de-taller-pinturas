import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "localhost",
    port: 5173,
    open: true,
    // En desarrollo, todo lo que el frontend pida a /api se redirige al
    // backend local (Backend/), así evitamos problemas de CORS sin tener
    // que apuntar a una URL completa en cada fetch.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
