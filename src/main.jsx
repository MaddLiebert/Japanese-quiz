import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

// PWA auto-update: saat service worker BARU mengambil alih halaman (setelah
// deploy), muat ulang sekali supaya user langsung dapat bundle terbaru — tanpa
// ini browser bisa terus menyajikan versi lama dari cache (pernah kejadian:
// perbaikan tidak terlihat di HP karena SW masih menyajikan bundle lama).
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
