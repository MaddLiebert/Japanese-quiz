// breathing.js — M15 app bernapas. Modul MURNI.
// Idle → gradien bergerak sangat lambat, drone BGM naik-turun, satu halaman
// berkedip seperti mata. Sentuh → berhenti (seolah ketahuan).
// Spec: docs/tema/meiji-mekanik.md §M15.

export const BREATH_PERIOD_MS = 6000;

// Fase 0..1 sinusoidal, periode ~6s.
export const breathPhase = (tMs) => {
  const t = Number(tMs) || 0;
  return (Math.sin((t / BREATH_PERIOD_MS) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
};

// Skala halus untuk gradien (0.98..1.02) — sangat halus, tak mengganggu.
export const breathScale = (tMs) => 1 + (breathPhase(tMs) - 0.5) * 0.04;

// "Terkejut" saat disentuh: napas berhenti (frozen) sementara.
export const breathStopped = (frozen) => Boolean(frozen);

export default breathPhase;
