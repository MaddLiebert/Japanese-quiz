// key → metadata visual. Komponen render sebenarnya ada di EffectContext.jsx.
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',         component: 'ink'   },
  hina:  { id: 'hina',  label: 'Hina Reaction',     component: 'hina'  },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
  gojo:  { id: 'gojo',  label: 'Gojo Domain',       component: 'gojo'  },
  yuji:  { id: 'yuji',  label: 'Yuji Cursed Fist',  component: 'yuji'  },
  sukuna:{ id: 'sukuna', label: 'Sukuna Malevolent Shrine', component: 'sukuna' },
  megumi:{ id: 'megumi', label: 'Megumi Ten Shadows', component: 'megumi' },
};

export const getVisual = (key) => VISUALS[key] || null;
