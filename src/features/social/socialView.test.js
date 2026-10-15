// socialView.test.js — logika murni 友達 (docs/friends.md §8).
// Menutup SEMUA state rel_state + input kotor, dan memastikan follow publik
// langsung vs privat minta pertemanan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REL, normalizeState, relLabel, actionFor, bucketConnections, requestCount, BUCKET_TABS, stateMap,
} from './socialView.js';

test('normalizeState: state tak dikenal → none', () => {
  assert.equal(normalizeState('friends'), 'friends');
  assert.equal(normalizeState('bogus'), 'none');
  assert.equal(normalizeState(null), 'none');
  assert.equal(normalizeState(undefined), 'none');
  assert.equal(normalizeState(42), 'none');
});

test('relLabel: tiap state punya label ID & EN', () => {
  assert.equal(relLabel(REL.FRIENDS, 'id'), 'Teman');
  assert.equal(relLabel(REL.FRIENDS, 'en'), 'Friends');
  assert.equal(relLabel(REL.PENDING_IN, 'id'), 'Minta berteman');
  assert.equal(relLabel(REL.SELF, 'id'), 'Kamu');
  assert.equal(relLabel(REL.NONE, 'id'), '');
});

test('actionFor: publik (none) → follow LANGSUNG', () => {
  const a = actionFor(REL.NONE, true);
  assert.equal(a.kind, 'follow');
  assert.equal(a.label, 'フォロー');
});

test('actionFor: privat (none) → minta pertemanan', () => {
  const a = actionFor(REL.NONE, false);
  assert.equal(a.kind, 'request');
  assert.equal(a.label, '友達申請');
});

test('actionFor: sudah berteman → CHIP STATUS + tombol hapus (bukan tombol tambah)', () => {
  const a = actionFor(REL.FRIENDS, true);
  assert.equal(a.kind, 'unfriend');
  assert.equal(a.status, true, 'friends = status chip, bukan tombol aksi biasa');
  assert.equal(a.label, '友達');
  assert.equal(a.labelId, 'Teman');
  // Label tombol hapus + teks konfirmasi tersedia (ID & EN).
  assert.equal(a.removeLabelId, 'Hapus Pertemanan');
  assert.equal(a.removeLabelEn, 'Remove friend');
  assert.equal(a.confirmId, 'Hapus pertemanan?');
  assert.equal(a.confirmEn, 'Remove friend?');
  // State lain BUKAN chip status.
  assert.ok(!actionFor(REL.FOLLOWING, true).status);
  assert.ok(!actionFor(REL.NONE, true).status);
});

test('bucketConnections: mengelompokkan & menahan input kotor', () => {
  const rows = [
    { bucket: 'friend', id: 'a' },
    { bucket: 'request_in', id: 'b' },
    { bucket: 'request_in', id: 'c' },
    { bucket: 'bogus', id: 'x' },
    null,
  ];
  const b = bucketConnections(rows);
  assert.equal(b.friend.length, 1);
  assert.equal(b.request_in.length, 2);
  assert.equal(b.following.length, 0);
  assert.equal(requestCount(rows), 2);
  // Input bukan array → bucket kosong, tidak crash.
  assert.equal(bucketConnections(null).friend.length, 0);
  assert.equal(requestCount(null), 0);
});

test('BUCKET_TABS: 4 tab (teman/mengikuti/pengikut/permintaan)', () => {
  assert.deepEqual(BUCKET_TABS.map((t) => t.key), ['friend', 'following', 'follower', 'request_in']);
});

test('actionFor: isPublic tak diketahui (baris leaderboard) → label netral 「追加」', () => {
  const a = actionFor(REL.NONE, null);
  assert.equal(a.kind, 'request');   // RPC yang memutuskan accepted vs pending
  assert.equal(a.label, '追加');
  assert.equal(a.labelId, 'Tambah');
  // State lain tak terpengaruh nilai isPublic.
  assert.equal(actionFor(REL.FRIENDS, null).kind, 'unfriend');
  assert.equal(actionFor(REL.PENDING_OUT, null).kind, 'cancel');
});

test('stateMap: bucket → rel_state, id kosong/baris kotor dilewati', () => {
  const rows = [
    { bucket: 'friend', id: 'a' },
    { bucket: 'following', id: 'b' },
    { bucket: 'follower', id: 'c' },
    { bucket: 'request_in', id: 'd' },
    { bucket: 'request_out', id: 'e' },
    { bucket: 'bogus', id: 'f' },
    { bucket: 'friend' },          // tanpa id → dilewati
    null,
  ];
  const m = stateMap(rows);
  assert.equal(m.get('a'), REL.FRIENDS);
  assert.equal(m.get('b'), REL.FOLLOWING);
  assert.equal(m.get('c'), REL.FOLLOWER);
  assert.equal(m.get('d'), REL.PENDING_IN);
  assert.equal(m.get('e'), REL.PENDING_OUT);
  assert.equal(m.has('f'), false);   // bucket tak dikenal → tak dipetakan
  assert.equal(stateMap(null).size, 0);
});
