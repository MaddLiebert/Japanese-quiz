// ─────────────────────────────────────────────────────────────────────────────
// socialView.js — logika murni 友達 TOMODACHI (docs/friends.md §8).
//
// MURNI: tanpa React/DOM/fetch → bisa dites `node --test`. Sumber tunggal label
// tombol & pengelompokan daftar, supaya FollowButton + halaman /friends + modal
// 訪問 + /u/:id TIDAK pernah beda perilaku.
//
// State hubungan (`rel_state`) datang dari server (SQL `public.rel_state`):
//   self | friends | following | follower | pending_out | pending_in | none
// ─────────────────────────────────────────────────────────────────────────────

export const REL = {
  SELF: 'self',
  FRIENDS: 'friends',
  FOLLOWING: 'following',
  FOLLOWER: 'follower',
  PENDING_OUT: 'pending_out',
  PENDING_IN: 'pending_in',
  NONE: 'none',
};

// State yang dikenal; apa pun di luar ini → 'none' (input kotor aman).
const KNOWN = new Set(Object.values(REL));

export const normalizeState = (state) =>
  KNOWN.has(state) ? state : REL.NONE;

// Label status (chip) — bilingual.
export const relLabel = (state, language) => {
  const id = language === 'id';
  switch (normalizeState(state)) {
    case REL.FRIENDS: return id ? 'Teman' : 'Friends';
    case REL.FOLLOWING: return id ? 'Mengikuti' : 'Following';
    case REL.FOLLOWER: return id ? 'Mengikutimu' : 'Follows you';
    case REL.PENDING_OUT: return id ? 'Menunggu' : 'Pending';
    case REL.PENDING_IN: return id ? 'Minta berteman' : 'Wants to be friends';
    case REL.SELF: return id ? 'Kamu' : 'You';
    default: return '';
  }
};

// Aksi yang boleh dilakukan atas sebuah state. Return null = tak ada tombol.
//   kind: follow | request | followback | cancel | respond | unfriend | unfollow
//   `isPublic` hanya relevan untuk state 'none' (publik → follow langsung).
//   `isPublic == null` (tak diketahui, mis. baris leaderboard) → label netral
//   「追加」; RPC `request_follow` sendiri yang menentukan accepted vs pending.
export const actionFor = (state, isPublic) => {
  switch (normalizeState(state)) {
    case REL.NONE:
      if (isPublic === null || isPublic === undefined) {
        return { kind: 'request', label: '追加', labelId: 'Tambah', labelEn: 'Add' };
      }
      return isPublic
        ? { kind: 'follow', label: 'フォロー', labelId: 'Ikuti', labelEn: 'Follow' }
        : { kind: 'request', label: '友達申請', labelId: 'Minta Pertemanan', labelEn: 'Add Friend' };
    case REL.FOLLOWER:
      return { kind: 'followback', label: 'フォロー返す', labelId: 'Ikuti Balik', labelEn: 'Follow back' };
    case REL.FOLLOWING:
      return { kind: 'unfollow', label: 'フォロー中', labelId: 'Mengikuti', labelEn: 'Following' };
    case REL.PENDING_OUT:
      return { kind: 'cancel', label: '申請中', labelId: 'Batalkan', labelEn: 'Cancel request' };
    case REL.PENDING_IN:
      return { kind: 'respond', label: '承認', labelId: 'Terima', labelEn: 'Accept' };
    case REL.FRIENDS:
      return { kind: 'unfriend', label: '友達', labelId: 'Teman', labelEn: 'Friends' };
    default:
      return null; // self → tak ada aksi
  }
};

// Kelompokkan baris `list_connections()` → { friend, following, follower, request_in, request_out }.
// Tahan input kotor: rows null / bucket tak dikenal diabaikan.
export const bucketConnections = (rows) => {
  const out = { friend: [], following: [], follower: [], request_in: [], request_out: [] };
  if (!Array.isArray(rows)) return out;
  for (const r of rows) {
    if (!r || !out[r.bucket]) continue;
    out[r.bucket].push(r);
  }
  return out;
};

// Jumlah permintaan masuk (badge TopControls / tab 申請).
export const requestCount = (rows) => {
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => r && r.bucket === 'request_in').length;
};

// Peta id → rel_state dari baris `list_connections()`. Dipakai baris LEADERBOARD
// (yang hanya membawa id) supaya tombol 友達 tahu status tanpa RPC per-baris.
// Bucket tak dikenal / baris tanpa id → dilewati (bukan dipetakan ke 'none').
export const stateMap = (rows) => {
  const out = new Map();
  if (!Array.isArray(rows)) return out;
  for (const r of rows) {
    if (!r || !r.id) continue;
    const st = r.bucket === 'request_in' ? REL.PENDING_IN
      : r.bucket === 'request_out' ? REL.PENDING_OUT
      : r.bucket === 'friend' ? REL.FRIENDS
      : r.bucket === 'following' ? REL.FOLLOWING
      : r.bucket === 'follower' ? REL.FOLLOWER
      : null;
    if (st) out.set(r.id, st);
  }
  return out;
};

// Label tab daftar — bilingual.
export const BUCKET_TABS = [
  { key: 'friend', jp: '友達', id: 'Teman', en: 'Friends' },
  { key: 'following', jp: 'フォロー中', id: 'Mengikuti', en: 'Following' },
  { key: 'follower', jp: 'フォロワー', id: 'Pengikut', en: 'Followers' },
  { key: 'request_in', jp: '申請', id: 'Permintaan', en: 'Requests' },
];

export default relLabel;
