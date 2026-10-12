// ─────────────────────────────────────────────────────────────────────────────
// storageBus.js — pengintai ringan untuk localStorage.
//
// Kenapa ada: kita butuh tahu KAPAN ProgressContext (dan key sync lain) berubah,
// supaya bisa push ke cloud. Kita TIDAK mengedit ProgressContext (biar minim
// risiko & tanpa siklus impor) — cukup membungkus `localStorage.setItem`/`
// removeItem` sekali, lalu memancarkan event ke subscriber. Ini menangkap
// SEMUA penulisan (termasuk `location.reload()` yang ditulis sinkron sebelum
// reload), yang tidak bisa dilakukan oleh event `storage` bawaan (itu hanya
// untuk tab LAIN, dan tidak jalan untuk penulisan di tab yang sama).
// ─────────────────────────────────────────────────────────────────────────────

import { SYNCED_KEYS } from './syncStore.js';

const listeners = new Set();
let installed = false;

const emit = (key) => {
  if (!key || !SYNCED_KEYS.includes(key)) return;
  for (const fn of listeners) {
    try {
      fn(key);
    } catch {
      /* subscriber error tidak boleh menghentikan penulisan storage */
    }
  }
};

// Bungkus sekali (idempoten). Aman kalau localStorage tidak ada (SSR/test node).
export const installStorageBus = () => {
  if (installed) return;
  if (typeof localStorage === 'undefined' || !localStorage) return;
  try {
    const origSet = localStorage.setItem.bind(localStorage);
    const origRemove = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (key, value) => {
      origSet(key, value);
      emit(key);
    };
    localStorage.removeItem = (key) => {
      origRemove(key);
      emit(key);
    };
    installed = true;
  } catch {
    // localStorage bisa saja read-only (mode privat ketat) → lewati, sync tetap
    // jalan lewat interval + push manual.
  }
};

// Dengarkan perubahan key sync. Return fungsi unsubscribe.
export const onStorageChange = (fn) => {
  installStorageBus();
  listeners.add(fn);
  return () => listeners.delete(fn);
};
