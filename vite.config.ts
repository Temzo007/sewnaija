import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig({
  base: "/sewnaija/",

  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      // IMPORTANT: you already have your own manifest.webmanifest
      manifest: false,

      includeAssets: [
        "favicon.ico",
        "icon-192.png",
        "icon-512.png"
      ],

      workbox: {
        navigateFallback: "/sewnaija/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      }
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  root: path.resolve(__dirname, "client"),

  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    host: "0.0.0.0",
    hmr: {
      overlay: false,
    },
  },
});
