import React, { useState } from 'react';
import { Glyph } from '../../components/icons/Glyph';
import { teamCapacity, isRoomFull } from './multiplayer';

export function RoomLobby({
  room,
  players,
  currentUserId,
  isHost,
  onSwitchTeam,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  language = 'id',
}) {
  const id = language === 'id';
  const mode = room?.mode || '1v1';
  const is2v2 = mode === '2v2';
  const cap = teamCapacity(mode);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard?.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const redPlayers = (players || []).filter((p) => p.team === 'red');
  const bluePlayers = (players || []).filter((p) => p.team === 'blue');

  const me = (players || []).find((p) => p.id === currentUserId);
  const myTeam = me?.team || 'red';
  const isReady = !!me?.isReady;

  const canStart = isRoomFull(
    redPlayers.map((p) => p.id),
    bluePlayers.map((p) => p.id),
    mode
  ) && (players || []).every((p) => p.id === room.host_id || p.isReady);

  const renderSlot = (player, team, slotIdx) => {
    if (!player) {
      return (
        <div
          key={`empty-${team}-${slotIdx}`}
          className="border-[2px] border-dashed border-sumi/30 p-3 sm:p-4 flex items-center justify-center min-h-[60px] bg-kinari/40 text-xs font-bold text-sumi/40"
        >
          {id ? 'Menunggu Pemain...' : 'Waiting for Player...'}
        </div>
      );
    }

    const isMe = player.id === currentUserId;
    const isPlayerHost = player.id === room?.host_id;

    return (
      <div
        key={player.id}
        className={`border-[3px] border-sumi p-3 flex items-center justify-between shadow-[2px_2px_0_0_#1a1a1a] ${
          isMe ? 'bg-kinari-light ring-2 ring-sumi' : 'bg-kinari'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full border-[2px] border-sumi bg-kinari-light flex items-center justify-center shrink-0 font-serif font-black text-xs">
            {player.avatar ? (
              <img src={player.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (player.username || '旅')[0]
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-sumi truncate flex items-center gap-1.5">
              <span>{player.username}</span>
              {isPlayerHost && (
                <span className="text-[9px] px-1 py-0.2 bg-sumi text-kinari-light font-sans font-bold">
                  HOST
                </span>
              )}
            </div>
            <div className="text-[10px] text-sumi/60 font-bold uppercase tracking-wider">
              {player.rank || 'Kouhai'}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {isPlayerHost ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-ai">
              {id ? 'Tuan Rumah' : 'Host'}
            </span>
          ) : player.isReady ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-matcha bg-matcha/10 border border-matcha px-1.5 py-0.5">
              ✓ {id ? 'Siap' : 'Ready'}
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider text-sumi/40">
              {id ? 'Menunggu' : 'Waiting'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header Room Info & Kode */}
      <div className="border-[4px] border-sumi bg-kinari-light p-6 shadow-[6px_6px_0_0_#1a1a1a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-sumi/50">
              {mode} · {room?.category || 'mixed'} · {room?.question_count || 10} {id ? 'SOAL' : 'Q'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-sumi tracking-tight mt-1">
              {id ? 'Ruang Tunggu Pertandingan' : 'Match Waiting Lounge'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div
              onClick={handleCopyCode}
              className="border-[3px] border-sumi bg-kinari px-4 py-2 cursor-pointer shadow-[3px_3px_0_0_#1a1a1a] hover:bg-kinari-light active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
              title={id ? 'Klik untuk salin kode' : 'Click to copy code'}
            >
              <div className="text-[9px] uppercase tracking-widest font-black text-sumi/50">
                {id ? 'KODE ROOM' : 'ROOM CODE'}
              </div>
              <div className="text-xl font-mono font-black tracking-widest text-ai">
                {room?.code || '------'}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              type="button"
              className="p-3 border-[3px] border-sumi bg-kinari-light hover:bg-sumi hover:text-kinari-light text-sumi transition-colors shadow-[2px_2px_0_0_#1a1a1a]"
              aria-label="Copy Room Code"
            >
              <Glyph name={copied ? 'check' : 'copy'} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Papan Tim (Merah vs Biru) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kubu Merah */}
        <div className="border-[4px] border-shu bg-shu/5 p-5 shadow-[4px_4px_0_0_#d3382f]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-shu inline-block"></span>
              <h3 className="text-base font-serif font-black text-shu tracking-wide">
                {id ? 'Tim Merah (紅組)' : 'Red Team (Aka)'}
              </h3>
            </div>
            <span className="text-xs font-mono font-black text-shu">
              {redPlayers.length}/{cap}
            </span>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: cap }).map((_, idx) => renderSlot(redPlayers[idx], 'red', idx))}
          </div>

          {is2v2 && myTeam === 'blue' && redPlayers.length < cap && (
            <button
              onClick={() => onSwitchTeam('red')}
              type="button"
              className="w-full mt-3 py-2 border-[2px] border-shu bg-shu text-kinari-light font-black uppercase text-xs tracking-widest shadow-[2px_2px_0_0_#1a1a1a] hover:brightness-110 active:translate-y-0.5 transition-all"
            >
              {id ? 'Pindah ke Merah' : 'Switch to Red'}
            </button>
          )}
        </div>

        {/* Kubu Biru */}
        <div className="border-[4px] border-ai bg-ai/5 p-5 shadow-[4px_4px_0_0_#182b49]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-ai inline-block"></span>
              <h3 className="text-base font-serif font-black text-ai tracking-wide">
                {id ? 'Tim Biru (藍組)' : 'Blue Team (Ao)'}
              </h3>
            </div>
            <span className="text-xs font-mono font-black text-ai">
              {bluePlayers.length}/{cap}
            </span>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: cap }).map((_, idx) => renderSlot(bluePlayers[idx], 'blue', idx))}
          </div>

          {is2v2 && myTeam === 'red' && bluePlayers.length < cap && (
            <button
              onClick={() => onSwitchTeam('blue')}
              type="button"
              className="w-full mt-3 py-2 border-[2px] border-ai bg-ai text-kinari-light font-black uppercase text-xs tracking-widest shadow-[2px_2px_0_0_#1a1a1a] hover:brightness-110 active:translate-y-0.5 transition-all"
            >
              {id ? 'Pindah ke Biru' : 'Switch to Blue'}
            </button>
          )}
        </div>
      </div>

      {/* Kontrol Aksi Bawah */}
      <div className="border-[4px] border-sumi bg-kinari-light p-5 shadow-[4px_4px_0_0_#1a1a1a] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <button
          onClick={onLeaveRoom}
          type="button"
          className="w-full sm:w-auto px-6 py-3 border-[3px] border-sumi bg-kinari text-sumi font-black uppercase tracking-widest text-xs hover:bg-shu hover:text-kinari-light transition-colors shadow-[2px_2px_0_0_#1a1a1a]"
        >
          {id ? '← Keluar Room' : '← Leave Room'}
        </button>

        <div className="flex gap-3 w-full sm:w-auto">
          {!isHost && (
            <button
              onClick={onToggleReady}
              type="button"
              className={`w-full sm:w-auto px-8 py-3.5 border-[3px] border-sumi font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-0.5 transition-all ${
                isReady
                  ? 'bg-matcha text-white'
                  : 'bg-kinari text-sumi hover:bg-kinari-light'
              }`}
            >
              {isReady ? (id ? '✓ Batal Siap' : '✓ Unready') : (id ? 'Siap (準備完了)' : 'Ready')}
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              type="button"
              className={`w-full sm:w-auto px-10 py-3.5 border-[3px] border-sumi font-black uppercase tracking-[0.2em] text-sm shadow-[4px_4px_0_0_#1a1a1a] active:translate-y-0.5 transition-all ${
                canStart
                  ? 'bg-ai text-kinari-light hover:brightness-110 cursor-pointer'
                  : 'bg-sumi/20 text-sumi/40 border-sumi/40 cursor-not-allowed'
              }`}
            >
              {id ? '▶ Mulai Pertandingan (開戦)' : '▶ Start Match'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
