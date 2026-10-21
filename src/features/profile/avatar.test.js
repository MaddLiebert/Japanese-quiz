import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidAvatarFile, initials, readAvatar, writeAvatar, clearAvatar,
  AVATAR_KEY, AVATAR_MAX_UPLOAD,
  coverScale, clampCropOffset, centerCropOffset, cropRectFromView,
} from './avatar.js';

const fakeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};

test('isValidAvatarFile: menolak kosong, tipe salah, terlalu besar', () => {
  assert.equal(isValidAvatarFile(null).ok, false);
  assert.equal(isValidAvatarFile({ type: 'text/plain', size: 10 }).ok, false);
  assert.equal(isValidAvatarFile({ type: 'image/png', size: AVATAR_MAX_UPLOAD + 1 }).ok, false);
});

test('isValidAvatarFile: menerima png/jpeg/webp/gif dalam batas', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
    assert.equal(isValidAvatarFile({ type, size: 1024 }).ok, true, type);
  }
});

test('initials: 2 karakter pertama, fallback 旅', () => {
  assert.equal(initials('Madd'), 'MA');
  assert.equal(initials('a'), 'A');
  assert.equal(initials('   '), '旅');
  assert.equal(initials(null), '旅');
});

test('writeAvatar → readAvatar → clearAvatar (round-trip)', () => {
  const s = fakeStorage();
  assert.equal(readAvatar(s), '');
  writeAvatar(s, 'data:image/jpeg;base64,AAA');
  assert.equal(s.getItem(AVATAR_KEY), 'data:image/jpeg;base64,AAA');
  assert.equal(readAvatar(s), 'data:image/jpeg;base64,AAA');
  clearAvatar(s);
  assert.equal(readAvatar(s), '');
});

test('writeAvatar: nilai kosong → string kosong (bukan "undefined")', () => {
  const s = fakeStorage();
  writeAvatar(s, undefined);
  assert.equal(readAvatar(s), '');
});

// ── Crop ────────────────────────────────────────────────────────────────────
const VIEW = 280;

test('coverScale: sisi terpendek mengisi viewport (cover)', () => {
  assert.equal(coverScale(1000, 1000, VIEW), VIEW / 1000); // persegi
  assert.equal(coverScale(2000, 1000, VIEW), VIEW / 1000); // lanskap → tinggi penuh
  assert.equal(coverScale(1000, 2000, VIEW), VIEW / 1000); // potret → lebar penuh
});

test('centerCropOffset: gambar lebih lebar → offset X negatif, Y 0', () => {
  const o = centerCropOffset({ scale: VIEW / 1000, imgW: 2000, imgH: 1000, view: VIEW });
  assert.equal(o.offsetY, 0);
  assert.equal(o.offsetX, -VIEW / 2);
});

test('clampCropOffset: tidak boleh ada celah kosong di tepi', () => {
  const base = { scale: VIEW / 1000, imgW: 2000, imgH: 1000, view: VIEW };
  // Geser ke kanan berlebihan → mentok 0.
  assert.equal(clampCropOffset({ ...base, offsetX: 500, offsetY: 0 }).offsetX, 0);
  // Geser ke kiri berlebihan → mentok -(2000*0.28 - 280) = -280.
  assert.equal(clampCropOffset({ ...base, offsetX: -9999, offsetY: 0 }).offsetX, -280);
  // Sumbu Y tidak bisa digeser (gambar pas tinggi).
  assert.equal(clampCropOffset({ ...base, offsetX: 0, offsetY: -50 }).offsetY, 0);
});

test('cropRectFromView: tengah gambar lanskap → kotak persegi di tengah', () => {
  const scale = VIEW / 1000;
  const rect = cropRectFromView({
    ...centerCropOffset({ scale, imgW: 2000, imgH: 1000, view: VIEW }),
    scale, imgW: 2000, imgH: 1000, view: VIEW,
  });
  assert.equal(rect.size, 1000);
  assert.equal(rect.sx, 500); // (2000 - 1000) / 2
  assert.equal(rect.sy, 0);
});

test('cropRectFromView: zoom 2× → kotak setengah sisi', () => {
  const scale = (VIEW / 1000) * 2;
  const rect = cropRectFromView({
    offsetX: (VIEW - 2000 * scale) / 2, offsetY: (VIEW - 2000 * scale) / 2,
    scale, imgW: 2000, imgH: 2000, view: VIEW,
  });
  assert.equal(rect.size, 500);
  assert.equal(rect.sx, 750);
  assert.equal(rect.sy, 750);
});

test('cropRectFromView: offset di luar batas tetap menghasilkan kotak valid', () => {
  const scale = VIEW / 1000;
  const rect = cropRectFromView({
    offsetX: 99999, offsetY: -99999, scale, imgW: 2000, imgH: 1000, view: VIEW,
  });
  assert.ok(rect.sx >= 0 && rect.sy >= 0);
  assert.ok(rect.sx + rect.size <= 2000);
  assert.ok(rect.sy + rect.size <= 1000);
});
