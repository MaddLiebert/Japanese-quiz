// ─────────────────────────────────────────────────────────────────────────────
// Death Quiz 死闘 — sistem SKILL (logika murni, tanpa React).
// Mekanik: COMBO 連撃 + METER 呪力.
//   • Tiap jawaban BENAR  → combo +1, meter +1.
//   • Salah / timeout     → combo & meter reset ke 0 (charge yang sudah didapat TETAP).
//   • Meter penuh (5)     → +1 CHARGE (banked), meter kembali 0.
//   • Charge dipakai untuk cast 1 skill aktif (六眼 / 無下限 / 反転術式).
// Combo terbaik satu run dipakai untuk bonus Medaru akhir run.
// Semua knob tuning ada di sini — jangan sebar angka ajaib di komponen.
// ─────────────────────────────────────────────────────────────────────────────

// Berapa jawaban benar untuk mengisi meter sampai penuh → 1 charge.
export const DEATH_METER_PER_CHARGE = 5;
// Batas charge yang bisa disimpan (biar tidak menumpuk tanpa batas).
export const DEATH_MAX_CHARGES = 3;
// 無下限 (Mugen): tambahan waktu pada soal yang sedang berjalan.
export const DEATH_MUGEN_BONUS_S = 5;
// Bonus Medaru per 1 combo terbaik di akhir run.
export const DEATH_COMBO_BONUS_PER = 5;

// ── Katalog skill aktif (semua gratis: dibayar pakai CHARGE, bukan Medaru) ────
// `kind` dipakai hook untuk tahu efek apa yang harus dijalankan.
export const DEATH_SKILLS = [
  {
    id: 'rikugan',
    kind: 'eliminate',
    icon: '👁',
    name: '六眼',
    name_en: 'Six Eyes',
    desc: 'Buang 2 opsi salah di soal ini',
    desc_en: 'Eliminate 2 wrong options',
  },
  {
    id: 'mugen',
    kind: 'time',
    icon: '∞',
    name: '無下限',
    name_en: 'Infinity',
    desc: `Tambah ${DEATH_MUGEN_BONUS_S} detik waktu`,
    desc_en: `Add ${DEATH_MUGEN_BONUS_S}s to the timer`,
  },
  {
    id: 'hanten',
    kind: 'life',
    icon: '✚',
    name: '反転術式',
    name_en: 'Reverse Cursed Technique',
    desc: 'Pulihkan 1 nyawa (命)',
    desc_en: 'Restore 1 life (命)',
  },
];

// Cari skill dari id; tidak ketemu → null.
export const deathSkillById = (skillId) => {
  if (typeof skillId !== 'string') return null;
  return DEATH_SKILLS.find((s) => s.id === skillId) || null;
};

// State skill awal tiap run.
export const deathInitialSkillState = () => ({ combo: 0, meter: 0, charges: 0 });

const clampCharges = (n) => Math.max(0, Math.min(DEATH_MAX_CHARGES, Math.floor(n) || 0));

// Jawaban BENAR → combo naik, meter ngisi; meter penuh → +1 charge (meter reset).
// Saat charge sudah mentok, meter tidak menumpuk (dibiarkan 0) supaya tidak ada
// "charge siluman" yang hilang begitu ada slot.
export const deathSkillOnCorrect = (state) => {
  const combo = (state?.combo || 0) + 1;
  const charges = clampCharges(state?.charges || 0);
  if (charges >= DEATH_MAX_CHARGES) {
    return { combo, meter: 0, charges };
  }
  const meter = (state?.meter || 0) + 1;
  if (meter >= DEATH_METER_PER_CHARGE) {
    return { combo, meter: 0, charges: clampCharges(charges + 1) };
  }
  return { combo, meter, charges };
};

// Jawaban SALAH / timeout → combo & meter reset. Charge yang sudah didapat TETAP
// (biar tidak menyiksa: kerja keras yang sudah jadi tidak hangus).
export const deathSkillOnWrong = (state) => ({
  combo: 0,
  meter: 0,
  charges: clampCharges(state?.charges || 0),
});

// Boleh cast kalau ada minimal 1 charge.
export const deathSkillCanCast = (state, skillId) =>
  deathSkillById(skillId) !== null && (state?.charges || 0) > 0;

// Pakai 1 charge (combo & meter tidak diubah).
export const deathSkillSpend = (state) => ({
  combo: state?.combo || 0,
  meter: state?.meter || 0,
  charges: clampCharges((state?.charges || 0) - 1),
});

// Bonus Medaru dari combo terbaik. Input aneh → 0.
export const deathComboBonus = (bestCombo) => {
  const c = Math.floor(Number(bestCombo));
  if (!Number.isFinite(c) || c <= 0) return 0;
  return c * DEATH_COMBO_BONUS_PER;
};

// Label cast untuk UI (dipakai saat menampilkan skill yang baru dipakai).
export const deathSkillCastLabel = (skillId, isId) => {
  const s = deathSkillById(skillId);
  if (!s) return '';
  return isId ? s.name : s.name_en;
};
