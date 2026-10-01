// Normalisasi path rute: buang query & hash, rapikan trailing slash.
// Dipakai modul yang memetakan RUTE → perilaku (mis. tutorial context-aware,
// gerbang senyap efek). Root '/' tetap '/'.

export const normalizePath = (pathname) => {
  let clean = typeof pathname === 'string' ? pathname.split('?')[0].split('#')[0] : '';
  if (clean.length > 1) clean = clean.replace(/\/+$/, '');
  if (clean === '') clean = '/';
  return clean;
};
