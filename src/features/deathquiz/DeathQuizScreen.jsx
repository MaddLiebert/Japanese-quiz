import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useUserStats, getRank } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDeathQuizSession } from "./useDeathQuizSession";
import { isDeathQuizUnlocked, DEATH_UNLOCK_XP, DEATH_XP_PENALTY, DEATH_START_LIVES, deathMedaruReward } from "./deathQuiz";

// Kartu statistik kecil (nyawa/skor/waktu) — gaya neo-brutalist repo.
function StatChip({ label, value, accent }) {
  return (
    <div className={`flex flex-col items-center px-3 sm:px-4 py-2 border-[3px] border-sumi bg-kinari-light shadow-[3px_3px_0_0_#1a1a1a] ${accent || ''}`}>
      <span className="text-[9px] uppercase tracking-[0.25em] font-black text-sumi/50">{label}</span>
      <span className="text-lg sm:text-xl font-serif font-black text-sumi leading-tight">{value}</span>
    </div>
  );
}

export function DeathQuizScreen() {
  const { progress } = useUserStats();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const id = language === 'id';
  const [confirmQuit, setConfirmQuit] = useState(false);

  const rank = getRank(progress.xp || 0);
  const unlocked = isDeathQuizUnlocked(rank);
  const xpNow = Math.min(progress.xp || 0, DEATH_UNLOCK_XP);
  const unlockPct = Math.round((xpNow / DEATH_UNLOCK_XP) * 100);

  const session = useDeathQuizSession();
  const { phase, current, options, lives, score, timeLeft, answeredId, isAnswered, runResult } = session;

  // Keluar: run yang sedang jalan harus konfirmasi dulu (nyawa & skor hangus).
  const handleBack = () => {
    if (phase === 'playing') { setConfirmQuit(true); return; }
    session.quit();
    navigate('/');
  };

  const backBtn = phase === 'revive' ? null : (
    <button
      onClick={handleBack}
      className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit cursor-pointer"
    >
      <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
    </button>
  );

  const shell = (children) => (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
      {backBtn}
      {children}
      {confirmQuit && (
        <div className="fixed inset-0 z-50 bg-sumi/40 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm border-[4px] border-sumi bg-kinari-light p-8 shadow-[8px_8px_0_0_#1a1a1a]"
          >
            <h3 className="text-lg font-serif font-black text-sumi mb-3">
              {id ? 'Keluar dari run?' : 'Quit this run?'}
            </h3>
            <p className="text-sm font-bold text-sumi/70 mb-6 leading-relaxed">
              {id
                ? 'Skor run ini hangus. Keluar sukarela TIDAK kena penalti XP.'
                : 'This run\'s score is lost. Quitting voluntarily does NOT cost XP.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmQuit(false); session.quit(); navigate('/'); }}
                className="flex-1 py-3 border-[3px] border-sumi font-black uppercase tracking-[0.15em] text-xs bg-shu text-kinari-light shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {id ? 'Keluar' : 'Quit'}
              </button>
              <button
                onClick={() => setConfirmQuit(false)}
                className="flex-1 py-3 border-[3px] border-sumi font-black uppercase tracking-[0.15em] text-xs bg-kinari text-sumi shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {id ? 'Lanjut Main' : 'Keep Playing'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  // ── Layar TERKUNCI (belum rank Shogun) ─────────────────────────────────────
  if (!unlocked) {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg border-[4px] border-sumi bg-kinari-light shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] p-8 sm:p-12 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-shu/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <span className="text-7xl sm:text-8xl font-serif font-black text-shu/80 mb-4 select-none">死</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-sumi mb-2">
            Death Quiz
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/50 mb-8">
            🔒 {id ? 'Rank Shogun' : 'Shogun Rank'}
          </p>

          <p className="text-sm font-bold text-sumi/70 mb-8 leading-relaxed">
            {id
              ? 'Mode endless paling brutal. Terkunci sampai kamu menyentuh rank Shogun.'
              : 'The most brutal endless mode. Locked until you reach Shogun rank.'}
          </p>

          <div className="w-full border-[3px] border-sumi/20 bg-kinari p-5 mb-6">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-sumi/50">
                {id ? 'Rank Sekarang' : 'Current Rank'}
              </span>
              <span className="text-sm font-serif font-black text-sumi">{rank}</span>
            </div>
            <div className="w-full h-3 bg-sumi/10 border-[2px] border-sumi/20 overflow-hidden">
              <div className="h-full bg-shu transition-all duration-700" style={{ width: `${unlockPct}%` }}></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-sumi/50 tracking-widest">
              <span>{xpNow.toLocaleString()} XP</span>
              <span>{DEATH_UNLOCK_XP.toLocaleString()} XP</span>
            </div>
          </div>

          <p className="text-xs font-bold text-sumi/40">
            {id ? `Kurang ${(DEATH_UNLOCK_XP - xpNow).toLocaleString()} XP lagi` : `${(DEATH_UNLOCK_XP - xpNow).toLocaleString()} XP to go`}
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Layar GAME OVER ────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg border-[4px] border-sumi bg-kinari-light shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] p-8 sm:p-12 flex flex-col items-center text-center"
        >
          <span className="text-7xl sm:text-8xl font-serif font-black text-shu mb-4 select-none">死</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-sumi mb-6">
            {id ? 'Kamu Mati' : 'You Died'}
          </h1>

          <div className="flex gap-4 mb-8 flex-wrap justify-center">
            <StatChip label={id ? 'Skor' : 'Score'} value={runResult?.score ?? score} />
            <StatChip label="命" value={`×${lives}`} />
            <StatChip
              label="XP"
              value={`−${runResult?.penaltyApplied ?? DEATH_XP_PENALTY}`}
              accent="!bg-shu/10 !border-shu"
            />
            <StatChip
              label="Medaru"
              value={`+${runResult?.medaruGained ?? 0}`}
              accent="!bg-kinari"
            />
          </div>

          <p className="text-sm font-bold text-sumi/70 mb-2 leading-relaxed">
            {id
              ? `Kamu kehilangan ${runResult?.penaltyApplied ?? DEATH_XP_PENALTY} XP.`
              : `You lost ${runResult?.penaltyApplied ?? DEATH_XP_PENALTY} XP.`}
          </p>
          <p className="text-sm font-black text-sumi mb-8 leading-relaxed">
            {(runResult?.medaruGained ?? 0) > 0
              ? (id ? `🪙 Kompensasi: +${runResult.medaruGained} Medaru` : `🪙 Compensation: +${runResult.medaruGained} Medaru`)
              : (id ? 'Skor belum cukup untuk kompensasi Medaru (min. 5).' : 'Score too low for Medaru compensation (min. 5).')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={session.start}
              className="flex-1 py-4 border-[4px] border-sumi font-black uppercase tracking-[0.2em] text-sm bg-sumi text-kinari-light shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all cursor-pointer"
            >
              {id ? 'Main Lagi' : 'Play Again'}
            </button>
            <button
              onClick={() => { session.quit(); navigate('/'); }}
              className="flex-1 py-4 border-[4px] border-sumi font-black uppercase tracking-[0.2em] text-sm bg-kinari text-sumi shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all cursor-pointer"
            >
              {id ? 'Kembali' : 'Back'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Layar REVIVE (nyawa habis tapi punya kabel jumper) ─────────────────────
  if (phase === 'revive') {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg border-[4px] border-shu bg-kinari-light shadow-[12px_12px_0_0_rgba(211,56,47,0.25)] p-8 sm:p-12 flex flex-col items-center text-center"
        >
          <span className="text-6xl sm:text-7xl mb-4 select-none">🔌</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-shu mb-4">
            {id ? 'Nyawa Habis!' : 'No Lives Left!'}
          </h1>
          <p className="text-sm font-bold text-sumi/70 mb-8 leading-relaxed">
            {id
              ? `Punya Kabel Jumper? Pakai untuk hidup lagi dengan 1 nyawa — skor & soal lanjut terus.`
              : 'Got a Jumper Cable? Use it to come back with 1 life — your score and progress continue.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={session.useJumper}
              className="flex-1 py-4 border-[4px] border-sumi font-black uppercase tracking-[0.15em] text-sm bg-ai text-kinari-light shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all cursor-pointer"
            >
              🔌 {id ? 'Pakai Kabel Jumper' : 'Use Jumper Cable'}
            </button>
            <button
              onClick={session.giveUp}
              className="flex-1 py-4 border-[4px] border-sumi font-black uppercase tracking-[0.15em] text-sm bg-kinari text-sumi shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all cursor-pointer"
            >
              {id ? 'Menyerah' : 'Give Up'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Layar INTRO ────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg border-[4px] border-sumi bg-kinari-light shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] p-8 sm:p-12 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-40 h-40 bg-shu/5 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          <span className="text-7xl sm:text-8xl font-serif font-black text-sumi mb-4 select-none">死闘</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-sumi mb-2">Death Quiz</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-shu mb-8">
            {id ? 'Mode Endless' : 'Endless Mode'}
          </p>

          <ul className="text-left text-sm font-bold text-sumi/70 space-y-3 mb-8 w-full">
            <li className="flex gap-3">
              <span className="text-shu">▶</span>
              {id ? `Semua konten kuis, tanpa henti — ${DEATH_START_LIVES} nyawa (命).` : `All quiz content, endless — ${DEATH_START_LIVES} lives (命).`}
            </li>
            <li className="flex gap-3">
              <span className="text-shu">▶</span>
              {id ? 'Salah atau kehabisan waktu = kehilangan 1 nyawa.' : 'Wrong answer or timeout = lose 1 life.'}
            </li>
            <li className="flex gap-3">
              <span className="text-shu">▶</span>
              {id ? 'Mati = kehilangan XP. Kabel jumper bisa menghidupkanmu kembali.' : 'Death = XP loss. A jumper cable can bring you back.'}
            </li>
            <li className="flex gap-3">
              <span className="text-shu">▶</span>
              {id ? 'Kompensasi: dapat Medaru makin banyak tiap jawaban benar (min. skor 5).' : 'Compensation: earn Medaru for every correct answer (min. score 5).'}
            </li>
          </ul>

          <button
            onClick={session.start}
            className="w-full py-5 border-[4px] border-sumi font-black uppercase tracking-[0.3em] text-base bg-sumi text-kinari-light shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1a1a1a] transition-all cursor-pointer"
          >
            {id ? 'Mulai' : 'Start'}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Layar MAIN (playing) ───────────────────────────────────────────────────
  if (!current) return shell(<div className="flex-1" />);

  const isKotoba = current.target.type === 'kotoba';
  const isKanji = current.target.type === 'kanji';
  const isGrammar = current.target.type === 'grammar';

  // Prompt utama sesuai tipe konten.
  let prompt;
  if (isGrammar) prompt = current.target.question;
  else if (isKotoba || isKanji) prompt = current.target.char;
  else prompt = current.target.char;

  const optionLabel = (opt) => {
    if (isGrammar) return opt.char;
    if (isKotoba) return (id && opt.meaning_id) ? opt.meaning_id : opt.meaning;
    if (isKanji) return (id && opt.meaning_id) ? opt.meaning_id : opt.meaning;
    return opt.romaji;
  };

  return shell(
    <div className="flex-1 flex flex-col relative z-10">
      {/* HUD */}
      <header className="flex flex-wrap justify-between items-end gap-4 mb-10 border-b-[4px] border-sumi pb-6 relative z-10">
        <div className="flex gap-3">
          <StatChip label="命" value={`×${lives}`} accent={lives <= 1 ? '!bg-shu/15 !border-shu' : ''} />
          <StatChip label={id ? 'Skor' : 'Score'} value={score} />
          <StatChip label="🪙" value={`+${deathMedaruReward(score)}`} />
        </div>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className={`px-4 py-2 border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] font-black ${timeLeft <= 3 ? 'bg-shu text-kinari-light animate-pulse' : 'bg-kinari-light text-sumi'}`}>
              <span className="text-[9px] uppercase tracking-[0.25em] font-black opacity-70 block">{id ? 'Waktu' : 'Time'}</span>
              <span className="text-xl font-serif leading-tight">{timeLeft}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Kartu soal */}
      <div className="flex-1 flex flex-col items-center">
        <motion.div
          key={current.target.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-lg mb-8"
        >
          <div className="bg-kinari border-[4px] border-sumi shadow-[8px_8px_0_0_#1a1a1a] p-8 sm:p-12 flex flex-col items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] bg-[length:14px_14px] text-sumi/[0.03] pointer-events-none"></div>
            <h2 className={`font-serif font-black text-sumi leading-tight select-none relative z-10 text-center break-words max-w-full ${isGrammar ? 'text-2xl sm:text-4xl leading-normal' : 'text-5xl sm:text-7xl md:text-8xl'}`}>
              {prompt}
            </h2>
            {isKanji && !isAnswered && (
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-sumi/40 relative z-10">
                {id ? '↓ Pilih artinya' : '↓ Choose the meaning'}
              </p>
            )}
            {isAnswered && isKanji && (
              <div className="flex flex-col items-center gap-1 border-t-[2px] border-sumi/10 pt-4 mt-2 relative z-10 w-full">
                <span className="text-sm text-sumi/60 font-bold">{current.target.onyomi} · {current.target.kunyomi}</span>
              </div>
            )}
            {isAnswered && isKotoba && (
              <div className="flex flex-col items-center gap-1 border-t-[2px] border-sumi/10 pt-4 mt-2 relative z-10 w-full">
                <span className="text-base font-bold tracking-widest text-sumi/50 uppercase">{current.target.romaji}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Opsi jawaban */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
          {options.map((option) => {
            const isThisClicked = answeredId === option.id;
            const isThisCorrect = option.id === current.target.id;
            const showGreen = isAnswered && isThisCorrect;
            const showRed = isThisClicked && !isThisCorrect;

            let btnClass = "border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] transition-all p-4 sm:p-5 font-bold text-sumi flex flex-col items-center justify-center rounded-none text-sm sm:text-base leading-snug min-h-[70px] ";
            if (!isAnswered) {
              btnClass += "bg-kinari hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#1a1a1a] hover:bg-kinari-light cursor-pointer";
            } else if (showGreen) {
              btnClass += "!bg-matcha !text-white !border-matcha translate-x-[2px] translate-y-[2px] !shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]";
            } else if (showRed) {
              btnClass += "!bg-shu !text-white !border-shu translate-x-[2px] translate-y-[2px] !shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]";
            } else {
              btnClass += "bg-kinari opacity-40 cursor-not-allowed";
            }

            return (
              <motion.button
                key={option.id}
                onClick={() => session.selectAnswer(option.id)}
                animate={
                  showGreen && isThisClicked ? { scale: [1, 1.04, 1] }
                    : showRed ? { x: [0, -8, 8, -8, 8, 0] }
                      : {}
                }
                transition={{ duration: 0.35 }}
                className={btnClass}
                disabled={isAnswered}
                data-correct={isThisCorrect || undefined}
              >
                <span className="text-center font-serif">{optionLabel(option)}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Status jawaban */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mt-6"
          >
            <div className={`w-full py-3 text-center font-bold text-sm uppercase tracking-widest border-[3px] ${session.lastResult?.correct
              ? 'bg-matcha/10 border-matcha text-matcha'
              : 'bg-shu/10 border-shu text-shu'
              }`}>
              {session.lastResult?.correct
                ? (id ? '✓ Benar!' : '✓ Correct!')
                : (id ? '✗ Salah — nyawa berkurang' : '✗ Wrong — life lost')}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
