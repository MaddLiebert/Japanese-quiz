// key → metadata visual. Komponen render sebenarnya ada di EffectContext.jsx.
export const VISUALS = {
  ink:   { id: 'ink',   label: 'Washi Ink',         component: 'ink'   },
  hina:  { id: 'hina',  label: 'Hina Reaction',     component: 'hina'  },
  dummy: { id: 'dummy', label: 'Dummy Placeholder', component: 'dummy' },
};

export const getVisual = (key) => VISUALS[key] || null;
