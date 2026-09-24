// ─────────────────────────────────────────────────────────────────────────────
// Logika murni efek Gojo Satoru (visual 'gojo'). Tanpa React/DOM → dites di node.
// Kanon: 蒼 (Ao) → 赫 (Aka) → 茈 (Murasaki = Ao+Aka) → 領域展開・無量空処 (Domain).
//
// Aturan (keputusan user, plan 9/23):
//   - benar#1 = 蒼, benar#2 = 赫, #3 & tiap milestone = 茈 (penyatuan)
//   - non-milestone setelah #3 → 蒼/赫 selang-seling (counter sendiri)
//   - milestone 50 = 無量空処; 100 (dan seterusnya) = versi zenith
//   - retak (cracks) HANYA di streak, makin gila per level
//   - salah → tidak ada teknik (klip suara menyusul), tanpa retak
// ─────────────────────────────────────────────────────────────────────────────

export const GOJO_MILESTONES = [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const isGojoMilestone = (streak) => GOJO_MILESTONES.includes(streak);

// Teknik untuk satu streak. streak = jumlah jawaban benar beruntun.
const techniqueForStreak = (streak) => {
  if (streak >= 100) return 'domain_zenith';       // 100 = zenith, terus mengunci
  if (streak === 50) return 'domain';              // 50 = 無量空処 (versi biasa)
  if (isGojoMilestone(streak)) return 'murasaki';  // 3,5,10,20,…,90 = 茈
  if (streak === 1) return 'ao';                   // nyicil komponen pertama
  if (streak === 2) return 'aka';                  // nyicil komponen kedua
  // streak >= 4 non-milestone → 蒼/赫 selang-seling (counter sendiri, tidak reset).
  const msInRange = GOJO_MILESTONES.filter((m) => m >= 4 && m <= streak).length;
  const idx = (streak - 3) - msInRange - 1;        // 0-based
  return idx % 2 === 0 ? 'ao' : 'aka';
};

// Teknik untuk satu jawaban. kind: 'correct' | 'wrong' | 'streak'.
//   wrong → null (tidak ada teknik; klip menyusul, tanpa retak).
export const gojoTechniqueFor = (kind, streak = 0) => {
  if (kind === 'wrong') return null;
  if (!Number.isFinite(streak) || streak <= 0) return 'ao';
  return techniqueForStreak(streak);
};

// Palet & kanji per teknik. Warna mengikuti kanon (ao biru, aka merah, 茈 ungu).
export const GOJO_STYLE = {
  ao:            { kanji: '蒼',       color: '#00b0ff', label: '蒼 · Ao' },
  aka:           { kanji: '赫',       color: '#e53935', label: '赫 · Aka' },
  murasaki:      { kanji: '茈',       color: '#9c27b0', label: '茈 · Murasaki' },
  domain:        { kanji: '無量空処', color: '#7c4dff', label: '領域展開・無量空処' },
  domain_zenith: { kanji: '無量空処', color: '#b388ff', label: '領域展開・無量空処' },
};

// Retak: HANYA streak. Jumlah cabang naik per level, dibatasi 14 (performa).
export const gojoCrackCount = (streak = 0) =>
  Math.min(3 + Math.floor(streak / 2), 14);

// Partikel: hisap (ao/domain) / ledak (aka) / spiral (murasaki).
// Murni & deterministik (rng bisa di-inject). Animasinya pakai transform/opacity.
export const gojoParticles = (technique, seed = 1, rng = Math.random) => {
  const spiral = technique === 'murasaki';
  const out = technique === 'aka';
  const count = spiral ? 22 : 16;
  const list = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 60 + rng() * 220;
    list.push({
      id: `${seed}-${i}`,
      angle,
      dist,
      size: 5 + rng() * 12,
      delay: rng() * 0.18,
      dur: 0.5 + rng() * 0.5,
      spin: spiral ? (rng() * 2 - 1) * 260 : 0,
      out,
      spiral,
    });
  }
  return list;
};
