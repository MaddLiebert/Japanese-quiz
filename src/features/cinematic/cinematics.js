// ─────────────────────────────────────────────────────────────────────────────
// Registry cinematic per-era + state "sudah dilihat".
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
//
// Konsep: tiap era punya SATU cinematic perkenalan. Diputar SEKALI saat pemain
// pertama kali mencapai era itu (pola sama seperti `tutorialSeen`), lalu bisa
// diputar ulang manual dari Pengaturan. State disimpan di progress
// (`cinematicsSeen`) supaya ikut persist + ikut "Reset Semua Data".
//
// Cinematic baru (Edo, Meiji, …) cukup ditambah ke CINEMATICS — host di
// CinematicContext otomatis tahu kapan harus memutarnya.
// ─────────────────────────────────────────────────────────────────────────────

export const CINEMATICS = {
  heian: { id: 'heian', era: 'heian', kind: 'history', title: '平安', route: '/heian-history' },
  edo: { id: 'edo', era: 'edo', kind: 'history', title: '江戸', route: '/edo-history' },
  meiji: { id: 'meiji', era: 'meiji', kind: 'history', title: '明治', route: '/meiji-history' },
  showa: { id: 'showa', era: 'showa', kind: 'history', title: '昭和', route: '/showa-history' },
  anime: { id: 'anime', era: 'anime', kind: 'history', title: '多元', route: '/anime-history' },
  cyberpunk: { id: 'cyberpunk', era: 'cyberpunk', kind: 'history', title: '電脳', route: '/cyberpunk-history' },
};

// ── State "sudah dilihat" (objek { [cinematicId]: true }) ────────────────────

export const emptyCinematics = () => ({});

// Sampah / bukan objek / array → {}. Objek valid → apa adanya (immutable-safe).
export const ensureCinematics = (seen) => {
  if (!seen || typeof seen !== 'object' || Array.isArray(seen)) return emptyCinematics();
  return seen;
};

export const hasSeenCinematic = (seen, id) => ensureCinematics(seen)[id] === true;

// Tandai sudah dilihat. Immutable; menandai 2× hasilnya sama (idempoten).
export const markCinematicSeen = (seen, id) => {
  const base = ensureCinematics(seen);
  if (!id || base[id] === true) return base;
  return { ...base, [id]: true };
};

// ── Pemetaan era → cinematic ─────────────────────────────────────────────────

export const cinematicForEra = (eraId) => CINEMATICS[eraId] || null;

// Cinematic yang HARUS diputar untuk era ini, atau null kalau tidak ada /
// sudah pernah dilihat. Dipakai host untuk memutuskan auto-play.
export const nextCinematic = (eraId, seen) => {
  const c = cinematicForEra(eraId);
  if (!c) return null;
  return hasSeenCinematic(seen, c.id) ? null : c.id;
};

// Ambil definisi cinematic by id (untuk replay manual dari Pengaturan).
export const getCinematic = (id) =>
  Object.values(CINEMATICS).find((c) => c.id === id) || null;
