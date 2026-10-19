import React from 'react';
import { motion } from 'motion/react';
import { MedaruCoin } from '../../components/MedaruCoin';

export function MatchResultModal({
  winner = 'draw', // 'red' | 'blue' | 'draw'
  myTeam = 'red',
  finalScores = { red: 0, blue: 0 },
  mvp = null,
  xpDelta = 0,
  medaruReward = 0,
  players = [],
  _perPlayerScore = {},
  onBackToLobby,
  language = 'id',
}) {
  const id = language === 'id';
  const isDraw = winner === 'draw';
  const isWon = !isDraw && myTeam === winner;

  return (
    <div className="fixed inset-0 z-50 bg-sumi/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg border-[5px] border-sumi bg-kinari-light p-6 sm:p-8 shadow-[10px_10px_0_0_#1a1a1a]"
      >
        {/* Banner Kemenangan */}
        <div className={`p-4 border-[3px] border-sumi text-center mb-6 shadow-[3px_3px_0_0_#1a1a1a] ${
          isDraw ? 'bg-kinari text-sumi' : isWon ? 'bg-matcha text-white' : 'bg-shu text-white'
        }`}>
          <div className="text-[10px] uppercase tracking-[0.4em] font-black opacity-80">
            {isDraw ? (id ? 'HASIL IMBANG' : 'DRAW MATCH') : isWon ? (id ? 'KEMENANGAN' : 'VICTORY') : (id ? 'KEKALAHAN' : 'DEFEAT')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tight mt-1">
            {isDraw ? '引き分け' : isWon ? '勝利' : '敗北'}
          </h2>
        </div>

        {/* Skor Kedua Tim */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`border-[3px] p-3 text-center ${winner === 'red' ? 'border-shu bg-shu/10' : 'border-sumi bg-kinari'}`}>
            <span className="text-[9px] font-black uppercase text-shu tracking-wider block">
              {id ? 'Tim Merah' : 'Red Team'}
            </span>
            <span className="text-3xl font-mono font-black text-shu">
              {finalScores.red}
            </span>
          </div>

          <div className={`border-[3px] p-3 text-center ${winner === 'blue' ? 'border-ai bg-ai/10' : 'border-sumi bg-kinari'}`}>
            <span className="text-[9px] font-black uppercase text-ai tracking-wider block">
              {id ? 'Tim Biru' : 'Blue Team'}
            </span>
            <span className="text-3xl font-mono font-black text-ai">
              {finalScores.blue}
            </span>
          </div>
        </div>

        {/* MVP Spotlight */}
        {mvp && (
          <div className="border-[3px] border-sumi bg-kinari p-3.5 mb-6 flex items-center justify-between shadow-[2px_2px_0_0_#1a1a1a]">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 bg-sumi text-kinari-light font-black text-[10px] tracking-wider">
                MVP
              </span>
              <span className="text-sm font-black text-sumi">
                {players.find((p) => p.id === mvp.mvpId)?.username || 'Pemain'}
              </span>
            </div>
            <span className="text-xs font-mono font-black text-ai">
              {mvp.mvpPoints} pts
            </span>
          </div>
        )}

        {/* Perolehan XP & Medaru */}
        <div className="border-t-[3px] border-sumi/20 pt-4 mb-6 flex justify-around text-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-black text-sumi/50 block">
              XP
            </span>
            <span className={`text-xl font-mono font-black ${
              xpDelta > 0 ? 'text-matcha' : xpDelta < 0 ? 'text-shu' : 'text-sumi'
            }`}>
              {xpDelta > 0 ? `+${xpDelta}` : xpDelta}
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-wider font-black text-sumi/50 block">
              Medaru
            </span>
            <span className="text-xl font-mono font-black text-sumi flex items-center justify-center gap-1">
              +{medaruReward} <MedaruCoin className="inline-block" />
            </span>
          </div>
        </div>

        {/* Tombol Balik ke Lobby */}
        <button
          onClick={onBackToLobby}
          type="button"
          className="w-full py-4 border-[3px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-[0.25em] text-sm shadow-[4px_4px_0_0_#1a1a1a] hover:brightness-110 active:translate-y-0.5 transition-all cursor-pointer"
        >
          {id ? 'Kembali ke Lobby' : 'Back to Lobby'}
        </button>
      </motion.div>
    </div>
  );
}
