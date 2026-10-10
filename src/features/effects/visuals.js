// key → metadata visual. Komponen render sebenarnya ada di EffectContext.jsx.
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',         component: 'ink'   },
  hina:  { id: 'hina',  label: 'Hina Reaction',     component: 'hina'  },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
  gojo:  { id: 'gojo',  label: 'Gojo Domain',       component: 'gojo'  },
  yuji:  { id: 'yuji',  label: 'Yuji Cursed Fist',  component: 'yuji'  },
  sukuna:{ id: 'sukuna', label: 'Sukuna Malevolent Shrine', component: 'sukuna' },
  megumi:{ id: 'megumi', label: 'Megumi Ten Shadows', component: 'megumi' },
  nobara:{ id: 'nobara', label: 'Nobara Straw Doll', component: 'nobara' },
  nanami:{ id: 'nanami', label: 'Nanami Ratio Technique', component: 'nanami' },
  toji:  { id: 'toji',   label: 'Toji Heavenly Restriction', component: 'toji' },
  yuta:  { id: 'yuta',   label: 'Yuta Copy Domain', component: 'yuta' },
  // ── 多元 Anime Multiverse — 5 dunia ORISINAL (E15 wiring) ───────────────────
  // Visual siluet generik (bukan desain tokoh). Render menyusul (R9); terdaftar
  // agar karakter (A16) tervalidasi & gerbang efek aktif saat pack 多元 dipakai.
  hoshi: { id: 'hoshi', label: 'Star Traveler',  component: 'hoshi' },
  kage:  { id: 'kage',  label: 'Shadow Ninja',   component: 'kage'  },
  mahou: { id: 'mahou', label: 'Magic Academy',  component: 'mahou' },
  kishin:{ id: 'kishin',label: 'Machine God',    component: 'kishin'},
  yokai: { id: 'yokai', label: 'Yokai Tales',    component: 'yokai' },
};

export const getVisual = (key) => VISUALS[key] || null;
