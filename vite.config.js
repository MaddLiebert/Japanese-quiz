import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'],
      manifest: {
        name: '日本語学園 · Nihongo Gakuen',
        short_name: 'Nihongo Gakuen',
        description: '日本語学園 Nihongo Gakuen — offline-capable JLPT N5 study app',
        theme_color: '#182b49',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}']
      }
    })
  ],
  define: {
    // ID build tampil di panel diagnosa Speaking → memastikan HP tidak
    // menyajikan bundle lama dari service worker. Pakai SHA commit Vercel
    // kalau ada, kalau tidak timestamp build.
    __BUILD_ID__: JSON.stringify(
      (typeof process !== 'undefined' && process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)) ||
      new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    ),
  },
  // Dev server buat akses dari HP (mis. via cloudflared tunnel).
  // - host:true → bind 0.0.0.0 (bukan cuma localhost)
  // - allowedHosts → izinkan hostname tunnel (kalau tidak: "Blocked request")
  // - port 5174 → konvensi repo (5173 dipakai proses lain)
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    allowedHosts: ['.trycloudflare.com'],
  },
})