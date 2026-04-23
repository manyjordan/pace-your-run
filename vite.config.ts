import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/functions/v1": {
        target: "http://localhost:54321",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-icon.png", "logo-icon.svg"],
      manifest: {
        name: "Pace — Votre coach running",
        short_name: "Pace",
        description: "Application de coaching running personnalisé",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/logo-icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo-icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/logo-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  optimizeDeps: {
    exclude: ["@perfood/capacitor-healthkit"],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: ["@perfood/capacitor-healthkit"],
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "framer-motion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
          ],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-dates": ["date-fns"],
          "vendor-sentry": ["@sentry/react"],
          "plans-weight": ["./src/lib/plans/weightPlans"],
          "plans-distance": ["./src/lib/plans/distancePlans"],
          "plans-race": ["./src/lib/plans/racePlans"],
        },
      },
    },
  },
}));
