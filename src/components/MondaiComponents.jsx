import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

export function AudioPlayer({
  audioSrc = "/audio/sample.mp3",
  duration = "0:24",
  isPlaying: externalIsPlaying,
  onPlay,
  onPause,
}) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 sampai 100
  const audioRef = useRef(null);

  const isControlled = typeof externalIsPlaying === "boolean";
  const isPlaying = isControlled ? externalIsPlaying : internalIsPlaying;

  // Bar tinggi waveform dekoratif neo-brutalis
  const waveformHeights = [
    30, 60, 40, 90, 75, 45, 100, 35, 55, 80, 40, 65, 30, 95, 50, 70, 35, 85,
  ];

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (!isControlled) setInternalIsPlaying(false);
      onPause?.();
    } else {
      audioRef.current
        .play()
        .then(() => {
          if (!isControlled) setInternalIsPlaying(true);
          onPlay?.();
        })
        .catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const current = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(current);
    }
  };

  const handleEnded = () => {
    if (!isControlled) setInternalIsPlaying(false);
    onPause?.();
    setProgress(0);
  };

  // Sync audio play state if controlled from outside
  useEffect(() => {
    if (isControlled && audioRef.current) {
      if (externalIsPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else if (!externalIsPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [externalIsPlaying, isControlled]);

  return (
    <div className="w-full bg-kinari border-sumi p-6 sm:p-8 shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)] flex flex-col items-center">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Tombol Bulat Besar dengan Outer Ring Brutalis */}
      <div className="relative group mb-5">
        <div className="absolute -inset-1 rounded-full bg-sumi opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Jeda Audio" : "Putar Audio"}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[4px] border-sumi flex flex-col items-center justify-center transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)] ${
            isPlaying
              ? "bg-shu text-kinari-light animate-pulse"
              : "bg-kinari-light text-sumi hover:bg-kinari"
          }`}
        >
          {isPlaying ? (
            /* Icon Pause */
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            /* Icon Play */
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-1.5"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          <span className="font-mono text-[9px] uppercase tracking-widest font-bold mt-1">
            {isPlaying ? "PAUSE" : "AUDIO PLAY"}
          </span>
        </button>
      </div>

      {/* Waveform Bar Visualizer */}
      <div className="w-full max-w-md bg-kinari-light border-[2px] border-sumi p-3 shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] mt-2">
        <div className="flex items-end justify-between h-10 px-2 gap-1 mb-2">
          {waveformHeights.map((h, i) => {
            const isFilled = (i / waveformHeights.length) * 100 <= progress;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 transition-all duration-150 ${
                  isFilled
                    ? "bg-shu"
                    : i % 3 === 0
                    ? "bg-sumi"
                    : "bg-sumi/30"
                }`}
              />
            );
          })}
        </div>

        {/* Garis Progress Bar & Penanda Waktu */}
        <div className="relative w-full h-2 bg-kinari border border-sumi overflow-hidden mb-1">
          <div
            className="h-full bg-shu transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-sumi font-bold">
          <span>0:00</span>
          <span>{duration}</span>
        </div>
      </div>

      <p className="font-mono text-[10px] tracking-wider uppercase font-bold text-sumi/70 mt-3">
        [ KLIK UNTUK MEMUTAR REKAMAN PERCAKAPAN (JEPANG ALAMI) ]
      </p>
    </div>
  );
}

export function QuizHeader({
  chapter = 1,
  chapterTitle = "Dai 1 Ka - Mondai 1",
  currentStep = 1,
  totalSteps = 5,
  streak = 0,
  xp = 0,
}) {
  return (
    <header className="w-full mb-6">
      {/* Top Global Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-sumi pb-3 mb-4">
        {/* User Stats (Streak & Total XP) */}
        <div className="flex items-center gap-2 font-mono">
          <div className="flex items-center gap-1.5 border-2 border-sumi bg-kinari-light px-3 py-1 shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]">
            <span className="text-shu">🔥</span>
            <div className="text-left leading-none">
              <span className="block text-[8px] uppercase tracking-wider text-sumi/60">STREAK</span>
              <span className="text-xs font-bold">{streak} DAYS</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-2 border-sumi bg-kinari-light px-3 py-1 shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]">
            <span className="text-ai">⚡</span>
            <div className="text-left leading-none">
              <span className="block text-[8px] uppercase tracking-wider text-sumi/60">TOTAL XP</span>
              <span className="text-xs font-bold">{xp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Sub-header & Question Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-sumi bg-kinari p-3 shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]">
        <div className="flex items-center gap-2">
          <span className="bg-sumi text-kinari-light font-mono font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 flex items-center gap-1.5">
            <span>🎧</span> MONDAI LISTENING
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="block font-mono text-[9px] uppercase tracking-wider text-sumi/60">CHAPTER TOPIC</span>
            <span className="font-serif font-bold text-sm text-sumi">
              Bab {chapter} - {chapterTitle}
            </span>
          </div>

          {/* Counter Badge */}
          <div className="bg-shu text-kinari-light border-2 border-sumi font-mono font-black text-sm px-3 py-1 shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]">
            {String(currentStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </div>
        </div>
      </div>
    </header>
  );
}

export function ExplanationBox({
  dialogScript = [],
  explanation = "",
  isCorrect = true,
  onNext,
  onRetry,
  isPlaying = false,
}) {
  return (
    <div className="w-full mt-6 space-y-4">
      {/* Banner Reward Benar / Salah */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-sumi bg-kinari-light p-3 shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 border-2 border-sumi flex items-center justify-center text-xs font-bold ${
              isCorrect ? "bg-matcha text-sumi" : "bg-shu text-kinari-light"
            }`}
          >
            {isCorrect ? "✓" : "✗"}
          </span>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-sumi">
              {isCorrect ? "JAWABAN ANDA BENAR! (正解)" : "JAWABAN ANDA KURANG TEPAT (不正解)"}
            </div>
            <div className="text-[11px] text-sumi/70 font-serif">
              {isCorrect
                ? "Pilihan jawaban tepat berdasarkan dialog yang diperdengarkan."
                : "Pelajari transkrip dan penjelasan di bawah untuk memahami jawaban yang benar."}
            </div>
          </div>
        </div>

        {isCorrect && (
          <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <span className="border-2 border-sumi bg-kinari-light px-2.5 py-1 shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)]">
              ⚡ +15 XP
            </span>
            <span className="border-2 border-sumi bg-kinari-light px-2.5 py-1 shadow-[2px_2px_0_0_rgba(var(--sumi-val),1)] text-shu">
              🔥 +1 STREAK
            </span>
          </div>
        )}
      </div>

      {/* Kotak Transkrip Audio */}
      {dialogScript && dialogScript.length > 0 && (
        <div className="border-[3px] border-sumi bg-kinari-light p-4 shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)]">
          <div className="flex justify-between items-center border-b-2 border-sumi pb-2 mb-3">
            <span className="bg-sumi text-kinari-light font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5">
              スクリプト (TRANSKRIP AUDIO)
            </span>
            <span className="font-mono text-[10px] text-sumi/60">
              Jepang • Percakapan
            </span>
          </div>

          <div className="space-y-2 font-serif text-sm leading-relaxed border-l-4 border-shu pl-3 py-1 bg-kinari/60">
            {dialogScript.map((line, idx) => (
              <p key={idx} className="text-sumi">
                <span className={`font-bold mr-2 ${line.speaker === "男" ? "text-shu" : "text-ai"}`}>
                  {line.speaker} :
                </span>
                {line.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Penjelasan Logika Jawaban */}
      {explanation && (
        <div className="mt-4 pt-3 border-t border-sumi/20 bg-matcha/15 p-3 border border-sumi">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-sumi mb-1">
            PENJELASAN LENGKAP:
          </span>
          <p className="font-serif text-xs leading-relaxed text-sumi">
            {explanation}
          </p>
        </div>
      )}

      {/* Tombol Aksi Bawah */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onRetry}
          className="border-[3px] border-sumi bg-kinari-light font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 shadow-[3px_3px_0_0_rgba(var(--sumi-val),1)] hover:bg-kinari active:translate-x-[2px] active:translate-y-[2px]"
        >
          ↺ ULANGI SOAL
        </button>

        <button
          onClick={onNext}
          disabled={isPlaying}
          className={`border-[3px] border-sumi font-mono text-xs font-bold uppercase tracking-wider px-6 py-2.5 shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)] hover:bg-opacity-90 active:translate-x-[2px] active:translate-y-[2px] transition-opacity ${
            isPlaying ? "opacity-50 cursor-not-allowed bg-ai/50" : "bg-ai text-kinari-light"
          }`}
        >
          {isPlaying ? "⏳ AUDIO BERJALAN..." : "SOAL BERIKUTNYA →"}
        </button>
      </div>
    </div>
  );
}

export function MondaiQuizResult({
  score = 0,
  totalQuestions = 5,
  wrongAnswers = [],
  mondaiData = [],
  onPlayAgain,
  onGoHome,
}) {
  const { language } = useLanguage();
  const percentage = (score / totalQuestions) * 100;
  let grade = 'C';
  if (percentage === 100) grade = 'S';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 60) grade = 'B';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-10 shadow-[12px_12px_0_0_rgba(var(--sumi-val),0.1)] relative w-full"
      >
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi mb-8 text-center tracking-tight">
          Hasil Quiz
        </h2>

        {/* Grade Circle */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[8px] border-shu text-shu flex flex-col items-center justify-center bg-kinari-light shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 border-[3px] border-shu opacity-60 rounded-full pointer-events-none"></div>
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-2 mt-4">
              Grade
            </span>
            <span className="text-6xl sm:text-7xl font-serif font-black leading-none">
              {grade}
            </span>
          </motion.div>
        </div>

        {/* Score Summary */}
        <div className="text-2xl sm:text-3xl font-serif text-sumi mb-2 font-bold tracking-widest border-b-[4px] border-sumi pb-4 text-center">
          {language === 'id' ? 'Benar' : 'Correct'}: <span className="text-ai">{score}</span> / {totalQuestions}
        </div>
        <div className="text-lg sm:text-xl font-serif text-sumi/80 font-bold tracking-widest text-center mb-8">
          {language === 'id' ? 'Salah' : 'Wrong'}: <span className="text-shu">{totalQuestions - score}</span>
          <span className="mx-2">•</span>
          {language === 'id' ? 'XP Diperoleh' : 'XP Earned'}: <span className="text-shu">+{score * 15}</span>
        </div>

        {/* Wrong Answers Review */}
        {wrongAnswers.length > 0 && (
          <div className="w-full bg-kinari p-6 sm:p-8 border-[4px] border-sumi shadow-[8px_8px_0_0_rgba(var(--sumi-val),1)] mb-8 relative">
            <h3 className="text-sm uppercase tracking-[0.3em] font-bold text-sumi/60 mb-4 border-b-[2px] border-sumi/20 pb-2">
              Perlu Latihan Lagi
            </h3>
            <div className="space-y-4">
              {wrongAnswers.map((idx, i) => {
                const item = mondaiData[idx];
                return (
                  <div key={i} className="bg-kinari-light p-4 border-[3px] border-sumi/10">
                    <p className="font-serif text-sm text-sumi mb-2">{item?.questionText || ''}</p>
                    <p className="text-xs font-bold text-ai uppercase tracking-wider">
                      Jawaban benar: {item?.options?.[item?.correctIndex] || ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 border-[4px] border-sumi bg-kinari text-sumi font-mono text-xs font-bold uppercase tracking-[0.2em] shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)] transition-all py-4"
          >
            Main Lagi
          </button>
          <button
            onClick={onGoHome}
            className="flex-1 border-[4px] border-sumi bg-sumi text-kinari-light font-mono text-xs font-bold uppercase tracking-[0.2em] shadow-[6px_6px_0_0_rgba(var(--sumi-val),1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(var(--sumi-val),1)] transition-all py-4"
          >
            Kembali ke Beranda
          </button>
        </div>
      </motion.div>
    </div>
  );
}