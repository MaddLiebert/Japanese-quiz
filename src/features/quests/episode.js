// ─────────────────────────────────────────────────────────────────────────────
// A11 デイリー (Misi harian = episode) — MURNI: tanpa React, tanpa DOM.
// Misi harian 多元 = 「第N話」 (episode hari ini). Bukan daftar tugas — tapi
// EPISODE yang berjudul. Tidak mengubah mekanik quest (hanya framing).
// Spec: docs/tema/anime-mekanik.md §A11.

// Judul episode = DATA (mudah ditambah), bukan hardcode di komponen.
export const EPISODE_TITLES = ['出会い', '日常', '決意', '試練', '仲間', '対決', '勝利', 'そして…'];

// Nomor episode: dayIndex 0 → 1, 1 → 2, … (minimal 1).
export const episodeNumber = (dayIndex) => Math.max(1, Math.floor(Number(dayIndex) || 0) + 1);

// Judul episode bersiklus; indeks negatif/tak valid tetap aman.
export const episodeTitle = (dayIndex) => {
  const len = EPISODE_TITLES.length;
  const n = Math.floor(Number(dayIndex) || 0);
  const i = ((n % len) + len) % len;
  return EPISODE_TITLES[i];
};

// Episode harian lengkap: { n, title }.
export const dailyEpisode = (dayIndex) => ({ n: episodeNumber(dayIndex), title: episodeTitle(dayIndex) });

export default dailyEpisode;
