import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// PWA auto-update HANYA di production build. Di DEV (vite dev server + tunnel
// buat tes dari HP) JANGAN daftarkan service worker / pasang listener reload:
// dulu halaman bisa ikut ke-reload sendiri saat SW berubah → user kena
// "refresh mulu pas lagi quiz" waktu tes dari HP sambil kode di-edit.
if (import.meta.env.PROD) {
  registerSW({ immediate: true })

  // Saat service worker BARU mengambil alih halaman (setelah deploy), muat
  // ulang sekali supaya user langsung dapat bundle terbaru — tanpa ini browser
  // bisa terus menyajikan versi lama dari cache (pernah kejadian: perbaikan
  // tidak terlihat di HP karena SW masih menyajikan bundle lama).
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  ) {
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    })
  }
} else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  // DEV self-heal: kalau HP/browser pernah memasang SW dari build production
  // (mis. tes tunnel sebelumnya), lepas SW + cache-nya supaya dev server
  // selalu menyajikan kode terbaru (tanpa reload mendadak).
  navigator.serviceWorker.getRegistrations().then((rs) => {
    rs.forEach((r) => r.unregister())
  })
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
