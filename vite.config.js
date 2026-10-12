import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { rmSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Audio MNN (87 file, 165 MB) dilayani Supabase Storage, BUKAN dari deploy.
// Vite menyalin SELURUH public/ ke dist/ → tanpa ini tiap deployment ~181 MB dan
// jatah Deployment Storage Hobby (10 GB) cepat habis.
//
// AMAN: hanya buang dist/audio kalau VITE_AUDIO_BASE_URL di-set. Kalau belum
// (env belum dikonfigurasi), audio LOKAL dipertahankan supaya app tetap bunyi.
const stripDeployedAudio = () => ({
  name: 'strip-deployed-audio',
  apply: 'build',
  closeBundle() {
    if (!process.env.VITE_AUDIO_BASE_URL) {
      console.log('[strip-deployed-audio] VITE_AUDIO_BASE_URL kosong → audio lokal dipertahankan di dist/')
      return
    }
    const dir = resolve(__dirname, 'dist/audio')
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
      console.log('[strip-deployed-audio] dist/audio dihapus (dilayani Supabase Storage)')
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    stripDeployedAudio(),
    VitePWA({
      registerType: 'autoUpdate',
      // ⚠️ JANGAN pakai ['**/*'] — itu menyapu SELURUH public/ ke precache (semua
      // mp3 audio 165MB + voices + gif efek + webp) sehingga tiap install PWA
      // mengunduh ratusan MB. Dulu: 725 entri / 181 MB di dist/sw.js.
      // Di sini hanya aset KECIL yang selalu dibutuhkan & tak tertangkap
      // globPatterns (ico/svg/png sudah masuk lewat globPatterns).
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
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
        // Precache app shell + data ringan (strokes json, art svg, font).
        // Media BERAT (mp3/gif/webp/jpg) TIDAK di sini → lewat runtimeCaching.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        // Bundle app-shell sudah ~2.1 MB (di atas batas default workbox 2 MiB) →
        // naikkan limit supaya app-shell TETAP ter-precache (offline utuh).
        // Media berat tetap keluar dari precache lewat globPatterns + runtimeCaching.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Media berat: cache saat PERTAMA dipakai (CacheFirst), bukan diunduh
        // semua saat install. Klip yang sudah diputar tetap tersedia offline.
        runtimeCaching: [
          {
            // mp3 (audio/voices) + gif/webp/jpg (efek & art).
            urlPattern: /\.(?:mp3|gif|webp|jpe?g)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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