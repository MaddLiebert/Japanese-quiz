// ─────────────────────────────────────────────────────────────────────────────
// Gerbang senyap efek — logika MURNI (tanpa React).
// Halaman yang butuh FOKUS PENUH (mis. Ujian N5 模擬試験) mematikan SEMUA efek
// JJK: klip suara karakter + visual (bar, domain, bola, GIF, tinta).
//
// PENTING: ini HANYA mematikan efek. Suara yang jadi ISI halaman (mis. audio
// soal Choukai 聴解) TIDAK lewat gerbang ini → tetap bunyi.
// ─────────────────────────────────────────────────────────────────────────────

import { normalizePath } from '../../utils/path.js';

// Rute "senyap efek". Tambah rute lain di sini kalau nanti diperlukan
// (mis. '/death-quiz'), tanpa menyentuh logika lain.
export const QUIET_ROUTES = ['/n5-exam'];

// Apakah rute ini harus senyap efek?
export const isQuietRoute = (pathname) => QUIET_ROUTES.includes(normalizePath(pathname));
