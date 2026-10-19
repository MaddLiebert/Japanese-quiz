// ─────────────────────────────────────────────────────────────────────────────
// multiplayerApi.js — lapisan komunikasi Supabase Realtime (合戦).
// Menggunakan Channel Presence & Broadcast (tanpa menulis DB tiap detik).
// Fail-open: aman berjalan jika Supabase belum terkonfigurasi.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from '../sync/supabaseClient.js';
import { generateRoomCode } from './multiplayer.js';

// ── Buat Room Baru ───────────────────────────────────────────────────────────
export async function createRoom({ mode = '1v1', category = 'mixed', questionCount = 10, seed = null }) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'unconfigured' };
  }

  const code = generateRoomCode();
  const quizSeed = typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000);

  try {
    // `multiplayer_rooms.host_id` FK ke `profiles.id`. Baris profil baru dibuat
    // saat push sync; user yang langsung buat room bisa kena FK error. Pastikan
    // barisnya ada dulu (no-op kalau sudah ada, tidak menimpa data).
    const uid = await getSessionUserId();
    if (uid) {
      const { error: pe } = await supabase
        .from('profiles')
        .upsert({ id: uid }, { onConflict: 'id', ignoreDuplicates: true });
      if (pe) return { ok: false, error: pe.message };
    }

    const { data, error } = await supabase.rpc('create_mp_room', {
      p_code: code,
      p_mode: mode,
      p_category: category,
      p_question_count: questionCount,
      p_seed: quizSeed,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, room: data, code };
  } catch (e) {
    return { ok: false, error: e?.message || 'network_error' };
  }
}

// ── Cari Room by Code ────────────────────────────────────────────────────────
export async function findRoom(code) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'unconfigured' };
  }

  try {
    const { data, error } = await supabase.rpc('find_mp_room', {
      p_code: String(code || '').trim().toUpperCase(),
    });

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'not_found' };
    return { ok: true, room: data };
  } catch (e) {
    return { ok: false, error: e?.message || 'network_error' };
  }
}

// ── Bergabung ke Realtime Channel Room ───────────────────────────────────────
// Mengembalikan channel Supabase yang sudah di-subscribe.
export function subscribeToRoom(code, { playerInfo, onPresenceSync, onBroadcast, onStatusChange }) {
  if (!isSupabaseConfigured || !supabase) return null;

  const channelName = `room:${String(code).toUpperCase()}`;
  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: playerInfo?.id || 'guest' },
      broadcast: { self: false }, // Jangan terima broadcast dari diri sendiri
    },
  });

  // 1. Presence: sync daftar pemain
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    if (onPresenceSync) onPresenceSync(state);
  });

  // 2. Broadcast: pesan antar pemain
  channel.on('broadcast', { event: '*' }, (payload) => {
    if (onBroadcast) onBroadcast(payload.event, payload.payload);
  });

  // 3. Subscribe & kirim presence data diri
  channel.subscribe((status) => {
    if (onStatusChange) onStatusChange(status);
    if (status === 'SUBSCRIBED') {
      channel.track({
        id: playerInfo?.id,
        authId: playerInfo?.authId || null,
        username: playerInfo?.username || '旅人',
        avatar: playerInfo?.avatar || '',
        rank: playerInfo?.rank || 'Kouhai',
        joinedAt: Date.now(),
      });
    }
  });

  return channel;
}

// ── ID Sesi Aktif ────────────────────────────────────────────────────────────
// Sumber otoritatif untuk identitas pemain: `auth.uid()` yang dipakai
// `create_mp_room` sebagai host_id. `useSync().user` bisa masih null saat
// room dibuat (state async) → host tidak dikenali sebagai host.
export async function getSessionUserId() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}

// ── Broadcast Helpers ────────────────────────────────────────────────────────
export function broadcastReady(channel, playerId, isReady) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'player_ready',
    payload: { playerId, isReady },
  });
}

export function broadcastSwitchTeam(channel, playerId, targetTeam) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'switch_team',
    payload: { playerId, targetTeam },
  });
}

export function broadcastStartGame(channel, { seed, startedAt }) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'game_start',
    payload: { seed, startedAt },
  });
}

export function broadcastAnswer(channel, { playerId, team, qIndex, isCorrect, points }) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'player_answer',
    payload: { playerId, team, qIndex, isCorrect, points },
  });
}

export function broadcastEmote(channel, playerId, emote) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'send_emote',
    payload: { playerId, emote },
  });
}
