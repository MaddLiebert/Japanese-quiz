// ─────────────────────────────────────────────────────────────────────────────
// merge.js — penggabungan "bundle" sync (progres) LOKAL ↔ REMOTE. MURNI:
// tanpa React, tanpa DOM, tanpa localStorage. Dites via `node --test`.
//
// Kebijakan v1 (sederhana & bisa ditebak — bukan CRDT):
//   • progress         → LAST-WRITE-WINS tingkat-bundle: ambil snapshot yang
//                        `updatedAt` lebih baru. (Medaru bisa TURUN karena belanja,
//                        jadi TIDAK boleh pakai max per-field — snapshot utuh lebih aman.)
//   • itemProgress     → gabung per-item: tiap item ambil `lastReviewed` terbaru;
//                        kunci digabung (union).
//   • achievements     → UNION (lencana tak pernah hilang).
//   • selectedBadges   → ikut pemenang progress (pilihan UI kecil, maks 4).
//   • username         → yang non-kosong; kalau dua-duanya ada → ikut pemenang.
//
// Return { bundle, winner } — winner ∈ 'local' | 'remote' | 'equal'.
// ─────────────────────────────────────────────────────────────────────────────

export const MERGE_VERSION = 1;

const asObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const asArr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (Number.isFinite(v) ? v : 0);

// Stempel waktu item: dukung `lastReviewed` (string tanggal / angka) atau `ts`.
const itemTime = (item) => {
  if (!item || typeof item !== 'object') return 0;
  const v = item.lastReviewed ?? item.ts;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
};

// Gabung dua peta itemProgress → tiap kunci ambil versi terbaru.
export const mergeItemProgress = (a = {}, b = {}) => {
  const out = { ...asObj(a) };
  for (const [id, item] of Object.entries(asObj(b))) {
    const mine = out[id];
    if (!mine) {
      out[id] = item;
    } else {
      out[id] = itemTime(item) > itemTime(mine) ? item : mine;
    }
  }
  return out;
};

export const mergeBundles = (local, remote) => {
  const l = local || {};
  const r = remote || {};

  const lt = num(l.updatedAt);
  const rt = num(r.updatedAt);
  const winner = rt > lt ? 'remote' : lt > rt ? 'local' : 'equal';

  // Snapshot progress + badge dari pemenang; kalau seri, utamakan lokal.
  const winProgress = winner === 'remote' ? asObj(r.progress) : asObj(l.progress);
  const winBadges = winner === 'remote' ? asArr(r.selectedBadges) : asArr(l.selectedBadges);

  // Username: pakai yang non-kosong (kalau dua-duanya ada → ikut pemenang).
  const lName = typeof l.username === 'string' ? l.username.trim() : '';
  const rName = typeof r.username === 'string' ? r.username.trim() : '';
  const username = winner === 'remote' ? (rName || lName) : (lName || rName);

  const achievements = Array.from(new Set([...asArr(l.achievements), ...asArr(r.achievements)]));

  return {
    winner,
    bundle: {
      version: MERGE_VERSION,
      username,
      progress: winProgress,
      itemProgress: mergeItemProgress(l.itemProgress, r.itemProgress),
      achievements,
      selectedBadges: winBadges.slice(0, 8),
      updatedAt: Math.max(lt, rt),
      deviceId: l.deviceId || r.deviceId || '',
    },
  };
};

export default mergeBundles;
