import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Furigana } from '../../components/Furigana';
import { MP_TIMER_S, MP_EMOTES } from './multiplayer';

export function BattleScreen({
  question,
  questionIndex,
  totalQuestions,
  myTeam = 'red',
  currentUserId,
  players = [],
  teamScores = { red: 0, blue: 0 },
  playerAnswers = {},
  liveEmotes = [],
  onSelectOption,
  onSendEmote,
  language = 'id',
}) {
  const id = language === 'id';
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MP_TIMER_S);

  // Timer per soal
  useEffect(() => {
    setSelectedIdx(null);
    setIsAnswered(false);
    setTimeLeft(MP_TIMER_S);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questionIndex]);

  // Handle timeout auto-fail
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      setIsAnswered(true);
      onSelectOption(null, 0); // timeout = 0 poin
    }
  }, [timeLeft, isAnswered, onSelectOption]);

  const handleChoose = (idx) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    const secondsUsed = MP_TIMER_S - timeLeft;
    onSelectOption(idx, secondsUsed);
  };

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  const renderPlayerBar = (player) => {
    const ans = playerAnswers[player.id];
    const isMe = player.id === currentUserId;

    return (
      <div key={player.id} className="relative flex items-center gap-2">
        <div className={`relative w-8 h-8 rounded-full border-[2px] border-sumi flex items-center justify-center shrink-0 font-serif font-black text-xs ${
          ans ? (ans.isCorrect ? 'ring-2 ring-matcha' : 'ring-2 ring-shu') : ''
        }`}>
          {player.avatar ? (
            <img src={player.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            (player.username || '旅')[0]
          )}

          {/* Sinyal benar/salah */}
          {ans && (
            <span className={`absolute -bottom-1 -right-1 text-[9px] font-black px-1 rounded-full text-white ${
              ans.isCorrect ? 'bg-matcha' : 'bg-shu'
            }`}>
              {ans.isCorrect ? `+${ans.points}` : '✕'}
            </span>
          )}
        </div>

        <div className="hidden sm:block min-w-0">
          <div className="text-[11px] font-black text-sumi truncate max-w-[80px]">
            {player.username} {isMe && '(Kamu)'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[560px]">
      {/* ── HUD Atas (Skor Tim Merah vs Biru & Timer) ── */}
      <div className="border-[4px] border-sumi bg-kinari-light p-4 shadow-[6px_6px_0_0_#1a1a1a] mb-6">
        <div className="flex items-center justify-between gap-2">
          {/* Sisi Merah */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-shu block">
                {id ? 'Kubu Merah' : 'Red Team'}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-shu">
                {teamScores.red}
              </span>
            </div>
            <div className="flex gap-1.5">{redPlayers.map(renderPlayerBar)}</div>
          </div>

          {/* Tengah: Timer Bulat */}
          <div className="flex flex-col items-center shrink-0 px-3">
            <div className="text-[9px] uppercase tracking-widest font-black text-sumi/50">
              {questionIndex + 1}/{totalQuestions}
            </div>
            <div className={`text-2xl sm:text-3xl font-mono font-black ${
              timeLeft <= 3 ? 'text-shu animate-pulse' : 'text-sumi'
            }`}>
              {timeLeft}
            </div>
          </div>

          {/* Sisi Biru */}
          <div className="flex items-center gap-3 justify-end min-w-0">
            <div className="flex gap-1.5">{bluePlayers.map(renderPlayerBar)}</div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-wider text-ai block">
                {id ? 'Kubu Biru' : 'Blue Team'}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-ai">
                {teamScores.blue}
              </span>
            </div>
          </div>
        </div>

        {/* Bar Timer Meluncur */}
        <div className="w-full bg-sumi/10 h-1.5 mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              myTeam === 'red' ? 'bg-shu' : 'bg-ai'
            }`}
            style={{ width: `${(timeLeft / MP_TIMER_S) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Kotak Soal ── */}
      <div className="flex-1 flex flex-col justify-center border-[4px] border-sumi bg-kinari p-6 sm:p-10 shadow-[6px_6px_0_0_#1a1a1a] mb-6 relative">
        {/* Floating Emotes */}
        <div className="absolute top-4 right-4 pointer-events-none flex flex-col gap-2">
          <AnimatePresence>
            {liveEmotes.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-kinari-light border-[2px] border-sumi px-2.5 py-1 text-sm font-serif font-black shadow-[2px_2px_0_0_#1a1a1a]"
              >
                {e.emote}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="text-center space-y-4">
          <span className="text-[10px] uppercase tracking-[0.3em] font-black text-sumi/50">
            {question?.type || 'QUIZ'}
          </span>

          <h2 className="text-3xl sm:text-5xl font-serif font-black text-sumi leading-tight">
            <Furigana text={question?.prompt || question?.char || question?.question} />
          </h2>
        </div>
      </div>

      {/* ── 4 Pilihan Jawaban ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {(question?.options || []).map((opt, idx) => {
          const isChosen = selectedIdx === idx;
          const label = opt?.char || opt?.romaji || opt?.meaning_id || opt?.meaning || opt?.answer || String(opt);

          return (
            <motion.button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleChoose(idx)}
              whileHover={!isAnswered ? { x: 2, y: 2 } : {}}
              whileTap={!isAnswered ? { x: 4, y: 4 } : {}}
              className={`p-4 border-[3px] border-sumi text-left font-serif font-bold text-sm sm:text-base transition-all shadow-[4px_4px_0_0_#1a1a1a] flex items-center gap-3 ${
                isChosen
                  ? 'bg-ai text-kinari-light !shadow-[2px_2px_0_0_#1a1a1a]'
                  : isAnswered
                  ? 'bg-kinari/50 text-sumi/40 cursor-not-allowed'
                  : 'bg-kinari text-sumi hover:bg-kinari-light cursor-pointer'
              }`}
            >
              <span className="w-6 h-6 rounded-full border-[2px] border-current flex items-center justify-center shrink-0 font-sans font-black text-xs">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="truncate flex-1">
                <Furigana text={label} />
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Bar Emote Bawah ── */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-[9px] uppercase tracking-wider font-black text-sumi/50 mr-2">
          {id ? 'Reaksi Cepat:' : 'Quick React:'}
        </span>
        {MP_EMOTES.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => onSendEmote(em)}
            className="w-9 h-9 border-[2px] border-sumi bg-kinari-light hover:bg-sumi hover:text-kinari-light font-serif font-black text-sm shadow-[2px_2px_0_0_#1a1a1a] active:translate-y-0.5 transition-all cursor-pointer"
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}
