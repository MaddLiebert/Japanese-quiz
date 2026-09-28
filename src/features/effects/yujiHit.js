// Efek "kena nonjok" pada tombol jawaban: arah dorong + penanda tombol.
// Vector MURNI (bisa dites tanpa DOM); markYujiPicked menyentuh DOM dengan guard.

// Arah dorong dari pusat layar ke arah tombol (satuan), dikali magnitude.
export const punchVector = (cx, cy, vw, vh, mag = 14) => {
  const dx = cx - vw / 2;
  const dy = cy - vh / 2;
  const len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || len === 0) return { x: 0, y: 0 };
  return {
    x: +((dx / len) * mag).toFixed(2),
    y: +((dy / len) * mag).toFixed(2),
  };
};

// Tandai tombol yang barusan dipencet + set arah dorongnya (--hit-x/--hit-y).
// Hanya SATU tombol yang bertanda; klik baru memindahkan tanda.
export const markYujiPicked = (el, win = typeof window !== 'undefined' ? window : null) => {
  if (!el || !win || typeof win.document === 'undefined') return false;
  const doc = win.document;
  doc.querySelectorAll('button[data-picked]').forEach((b) => {
    if (b !== el) { delete b.dataset.picked; b.style.removeProperty('--hit-x'); b.style.removeProperty('--hit-y'); }
  });
  const r = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
  if (r) {
    const v = punchVector(r.left + r.width / 2, r.top + r.height / 2, win.innerWidth, win.innerHeight);
    el.style.setProperty('--hit-x', `${v.x}px`);
    el.style.setProperty('--hit-y', `${v.y}px`);
  }
  el.dataset.picked = '1';
  return true;
};
