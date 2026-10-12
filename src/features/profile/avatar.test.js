import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidAvatarFile, initials, readAvatar, writeAvatar, clearAvatar,
  AVATAR_KEY, AVATAR_MAX_UPLOAD,
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
