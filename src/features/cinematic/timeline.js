// ─────────────────────────────────────────────────────────────────────────────
// timeline.js — helper timeline GENERIK untuk cinematic era mana pun.
//
// Modul MURNI (tanpa React/DOM) → dites via `node --test`.
// Semua fungsi menerima `scenes` sebagai argumen pertama sehingga satu mesin
// dipakai ulang oleh Heian, Edo, dan era berikutnya (data-driven).
//
// Bentuk scene (kontrak bersama):
//   {
//     id, duration, visual, mood,
//     lines: [{ id, jp, translation, kind, at, translationAt, sub?, voice? }],
//     audio: { cues: [{ sfx, at, gain? }] },
//     kana?: { glyphs, at, gap }
//   }
// ─────────────────────────────────────────────────────────────────────────────

// Total durasi seluruh cinematic (detik).
export const totalDuration = (scenes) => scenes.reduce((sum, s) => sum + s.duration, 0);

// Waktu MULAI (absolut, detik) tiap scene.
export const sceneStartTimes = (scenes) => {
  let t = 0;
  return scenes.map((s) => {
    const start = t;
    t += s.duration;
    return start;
  });
};

// Scene ke-berapa yang aktif pada detik `t` (0-based). Di luar rentang → dijepit.
export const sceneAtTime = (scenes, t) => {
  if (!scenes.length) return 0;
  const starts = sceneStartTimes(scenes);
  if (t < 0) return 0;
  for (let i = scenes.length - 1; i >= 0; i -= 1) {
    if (t >= starts[i]) return i;
  }
  return 0;
};

// Ubah `at` relatif-scene menjadi waktu ABSOLUT.
export const absoluteLineTimes = (scene, sceneStart = 0) =>
  (scene.lines || []).map((l) => ({
    id: l.id,
    at: sceneStart + l.at,
    translationAt: l.translationAt == null ? null : sceneStart + l.translationAt,
  }));

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Daftar pemicu SFX absolut (banyak per scene), terurut waktu.
export const audioCues = (scenes) => {
  const starts = sceneStartTimes(scenes);
  const out = [];
  scenes.forEach((s, i) => {
    (s.audio?.cues || []).forEach((c, j) => {
      out.push({
        id: `${s.id}:${c.sfx}:${j}`,
        sceneId: s.id,
        sfx: c.sfx,
        at: starts[i] + (c.at || 0),
        gain: c.gain == null ? 1 : c.gain,
      });
    });
  });
  return out.sort((a, b) => a.at - b.at);
};

// Daftar pemicu voice absolut — satu per BARIS yang punya `voice`.
export const voiceCues = (scenes) => {
  const starts = sceneStartTimes(scenes);
  const out = [];
  scenes.forEach((s, i) => {
    (s.lines || []).forEach((l) => {
      if (!l.voice) return;
      out.push({
        id: `voice:${s.id}:${l.id}`,
        sceneId: s.id,
        lineId: l.id,
        path: l.voice,
        at: starts[i] + (l.at || 0),
      });
    });
  });
  return out.sort((a, b) => a.at - b.at);
};

// Kapan "mood" ambience berubah: [{ at, mood }].
export const ambienceTimeline = (scenes) => {
  const starts = sceneStartTimes(scenes);
  return scenes.map((s, i) => ({ at: starts[i], mood: s.mood || 'calm' }));
};

// Opasitas scene ke-i pada detik `t`. Cross-fade di-center pada batas scene.
export const sceneOpacityAt = (scenes, i, t, fade = 1.7) => {
  const starts = sceneStartTimes(scenes);
  const s = starts[i];
  const e = s + scenes[i].duration;
  const half = fade / 2;
  let op = 1;
  if (i > 0) {
    if (t < s + half) op = Math.min(op, clamp01((t - (s - half)) / fade));
  } else if (t < half) {
    op = Math.min(op, clamp01(t / half));
  }
  if (i < scenes.length - 1) {
    if (t > e - half) op = Math.min(op, clamp01(((e + half) - t) / fade));
  } else if (t > e - half) {
    op = Math.min(op, clamp01((e - t) / half));
  }
  return clamp01(op);
};

// Indeks scene yang perlu DI-MOUNT pada detik `t` (jendela + padding).
export const visibleSceneIndices = (scenes, t, fade = 1.7, pad = 0.25) => {
  const starts = sceneStartTimes(scenes);
  const half = fade / 2;
  const out = [];
  scenes.forEach((sc, i) => {
    const s = starts[i];
    const e = s + sc.duration;
    if (t >= s - half - pad && t <= e + half + pad) out.push(i);
  });
  return out;
};

// Validasi ringan untuk tes: id unik, durasi > 0, timing wajar, cue audio valid.
export const validateScenes = (scenes) => {
  const errors = [];
  const ids = new Set();
  scenes.forEach((s, i) => {
    if (!s.id) errors.push(`scene[${i}] tanpa id`);
    if (ids.has(s.id)) errors.push(`id scene duplikat: ${s.id}`);
    ids.add(s.id);
    if (!(s.duration > 0)) errors.push(`scene ${s.id} durasi harus > 0`);
    (s.lines || []).forEach((l) => {
      if (!l.jp) errors.push(`scene ${s.id} baris ${l.id} tanpa jp`);
      if (!(l.at >= 0)) errors.push(`scene ${s.id} baris ${l.id} at harus >= 0`);
      if (l.at > s.duration) errors.push(`scene ${s.id} baris ${l.id} at melewati durasi scene`);
      if (l.translationAt != null && l.translationAt < l.at) {
        errors.push(`scene ${s.id} baris ${l.id}: terjemahan harus muncul SETELAH teks Jepang`);
      }
    });
    (s.audio?.cues || []).forEach((c, j) => {
      if (!c.sfx) errors.push(`scene ${s.id} cue[${j}] tanpa sfx`);
      if (!(c.at >= 0) || c.at > s.duration) errors.push(`scene ${s.id} cue[${j}] at di luar durasi scene`);
    });
  });
  return errors;
};
