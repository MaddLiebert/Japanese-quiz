// profileError.test.js — pesan error profil publik yang ramah (murni).
import test from 'node:test';
import assert from 'node:assert/strict';
import { isMissingRpc, isUnconfigured, profileErrorCopy } from './profileError.js';

// Pesan asli dari PostgREST saat fungsi belum ada di schema cache.
const PGRST202 =
  'Could not find the function public.public_profile(p_id) in the schema cache';

test('isMissingRpc: mengenali PGRST202 / schema cache', () => {
  assert.equal(isMissingRpc(PGRST202), true);
  assert.equal(isMissingRpc('PGRST202'), true);
  assert.equal(isMissingRpc(''), false);
  assert.equal(isMissingRpc(null), false);
  assert.equal(isMissingRpc('some other error'), false);
});

test('isUnconfigured: hanya "unconfigured"', () => {
  assert.equal(isUnconfigured('unconfigured'), true);
  assert.equal(isUnconfigured('other'), false);
});

test('profileErrorCopy: RPC hilang → arahkan jalankan schema.sql (ID & EN)', () => {
  const id = profileErrorCopy(PGRST202, 'id');
  assert.match(id.title, /Backend belum diperbarui/i);
  assert.match(id.hint, /schema\.sql/i);

  const en = profileErrorCopy(PGRST202, 'en');
  assert.match(en.title, /Backend not updated/i);
  assert.match(en.hint, /schema\.sql/i);
});

test('profileErrorCopy: unconfigured → arahkan isi env', () => {
  const id = profileErrorCopy('unconfigured', 'id');
  assert.match(id.title, /belum dikonfigurasi/i);
  assert.match(id.hint, /VITE_SUPABASE_URL/);
});

test('profileErrorCopy: error lain → diteruskan apa adanya + judul generik', () => {
  const r = profileErrorCopy('network down', 'id');
  assert.match(r.title, /Gagal memuat/i);
  assert.equal(r.hint, 'network down');

  const empty = profileErrorCopy('', 'en');
  assert.match(empty.title, /Failed to load/i);
  assert.ok(empty.hint.length > 0);
});
