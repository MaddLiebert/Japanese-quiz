import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";
import { Furigana } from "../../components/Furigana";
import { AudioPlayer } from "../../components/MondaiComponents";
import { useN5Exam } from "./useN5Exam";
import {
  N5_SECTIONS, N5_SECTION_ORDER, N5_TOTAL_MINUTES, sectionRawTotal,
  formatClock, LKR_MAX, LISTENING_MAX, N5_PASS_TOTAL, N5_PASS_LKR, N5_PASS_LISTENING,
} from "./n5exam";
import { mondaiLabel, mondaiGloss } from "./mondaiLabels";

// Kartu statistik kecil (neo-brutalist, sama seperti Death Quiz).
export function N5ExamScreen() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const id = language === 'id';
  const s = useN5Exam();
  const [confirmQuit, setConfirmQuit] = useState(false);

  const shell = (children) => (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-20 min-h-screen flex flex-col relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-seigaiha opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
      {children}
      {confirmQuit && (
        <div className="fixed inset-0 z-50 bg-sumi/40 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm border-[4px] border-sumi bg-kinari-light p-8 shadow-[8px_8px_0_0_#1a1a1a]"
          >
            <h3 className="text-lg font-serif font-black text-sumi mb-3">
              {id ? 'Keluar dari ujian?' : 'Quit the exam?'}
            </h3>
            <p className="text-sm font-bold text-sumi/70 mb-6 leading-relaxed">
              {id
                ? 'Progres ujian ini akan hangus. Keluar tidak kena penalti.'
                : 'Your exam progress will be lost. Quitting costs nothing.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmQuit(false); s.quit(); navigate('/'); }}
                className="flex-1 py-3 border-[3px] border-sumi font-black uppercase tracking-[0.15em] text-xs bg-shu text-kinari-light shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {id ? 'Keluar' : 'Quit'}
              </button>
              <button
                onClick={() => setConfirmQuit(false)}
                className="flex-1 py-3 border-[3px] border-sumi font-black uppercase tracking-[0.15em] text-xs bg-kinari text-sumi shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {id ? 'Lanjut' : 'Stay'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const handleBack = () => {
    if (s.phase === 'section') { setConfirmQuit(true); return; }
    s.quit();
    navigate('/');
  };

  const backBtn = (
    <button
      onClick={handleBack}
      className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20 w-fit cursor-pointer"
    >
      <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
    </button>
  );

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (s.phase === 'intro') {
    return shell(
      <>
        {backBtn}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border-[4px] border-sumi bg-kinari-light shadow-[10px_10px_0_0_rgba(26,26,26,0.1)] relative z-10">
          <header className="border-b-[4px] border-sumi p-6 sm:p-10 bg-seigaiha relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[12rem] font-serif text-sumi opacity-[0.05] pointer-events-none select-none leading-none">試</div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-sumi/60">{id ? 'Ujian Tiruan' : 'Mock Exam'}</span>
              <h1 className="text-4xl sm:text-6xl font-serif font-black text-sumi tracking-tighter mt-2">
                N5 <span className="text-shu">模擬試験</span>
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-sumi/60 mt-4">
                {id ? `JLPT N5 · 3 Seksi · ${N5_TOTAL_MINUTES} Menit` : `JLPT N5 · 3 Sections · ${N5_TOTAL_MINUTES} Min`}
              </p>
            </div>
          </header>

          <div className="p-6 sm:p-10">
            <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-sumi/50 mb-4">{id ? 'Struktur Ujian' : 'Exam Structure'}</h3>
            <div className="flex flex-col gap-3 mb-8">
              {N5_SECTION_ORDER.map((key, i) => (
                <div key={key} className="flex items-center justify-between border-[3px] border-sumi bg-kinari px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center bg-sumi text-kinari-light font-serif font-black text-sm">{i + 1}</span>
                    <span className="text-sm font-bold text-sumi">{N5_SECTIONS[key].label[id ? 'id' : 'en']}</span>
                  </div>
                  <span className="text-xs font-black tracking-widest text-sumi/60">{N5_SECTIONS[key].minutes} {id ? 'MNT' : 'MIN'} · {sectionRawTotal(key)} {id ? 'SOAL' : 'Q'}</span>
                </div>
              ))}
            </div>

            <div className="border-[3px] border-shu bg-shu/5 p-4 mb-8">
              <p className="text-xs font-bold text-sumi/80 leading-relaxed">
                {id
                  ? `Aturan: tiap seksi punya waktunya sendiri. Kalau waktu habis, seksi otomatis dikumpul dan TIDAK bisa balik. Lulus = total ≥${N5_PASS_TOTAL}/180 DAN Kosakata+Tata Bahasa+Membaca ≥${N5_PASS_LKR}/120 DAN Menyimak ≥${N5_PASS_LISTENING}/60.`
                  : `Rules: each section is timed. When time runs out, the section auto-submits and you CANNOT go back. Pass = total ≥${N5_PASS_TOTAL}/180 AND Vocab+Grammar+Reading ≥${N5_PASS_LKR}/120 AND Listening ≥${N5_PASS_LISTENING}/60.`}
              </p>
            </div>

            <button
              onClick={s.start}
              className="w-full py-4 border-[4px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-[0.3em] text-sm shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer"
            >
              {id ? '▶ Mulai Ujian' : '▶ Start Exam'}
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  // ── SECTION BREAK ────────────────────────────────────────────────────────
  if (s.phase === 'sectionBreak') {
    const nextKey = N5_SECTION_ORDER[s.sectionIndex + 1];
    return shell(
      <div className="flex-1 flex items-center justify-center relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg border-[4px] border-sumi bg-kinari-light p-8 sm:p-12 text-center shadow-[8px_8px_0_0_#1a1a1a]">
          <div className="text-5xl font-serif font-black text-shu mb-4">休</div>
          <h2 className="text-2xl font-serif font-black text-sumi mb-2">{id ? 'Seksi Selesai' : 'Section Complete'}</h2>
          {s.lastTimedOut && (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-shu mb-2">{id ? '⏱ Waktu habis — seksi dikumpul otomatis' : '⏱ Time up — auto-submitted'}</p>
          )}
          <p className="text-sm font-bold text-sumi/70 mb-8">
            {id ? 'Seksi berikutnya: ' : 'Next section: '}
            <span className="text-sumi">{nextKey ? N5_SECTIONS[nextKey].label[id ? 'id' : 'en'] : ''}</span>
            {nextKey ? ` · ${N5_SECTIONS[nextKey].minutes} ${id ? 'menit' : 'min'}` : ''}
          </p>
          <button
            onClick={s.continueToNextSection}
            className="w-full py-4 border-[4px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-[0.3em] text-sm shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer"
          >
            {id ? 'Lanjut ke Seksi Berikutnya' : 'Continue'}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── SECTION (soal berjalan) ──────────────────────────────────────────────
  if (s.phase === 'section' && s.currentItem) {
    const it = s.currentItem;
    const secKey = N5_SECTION_ORDER[s.sectionIndex];
    const section = s.currentSection;
    const isCorrect = s.isAnswered && s.selected === it.correctIndex;
    const danger = s.timeLeft !== null && s.timeLeft <= 300;

    return shell(
      <>
        {backBtn}
        <header className="flex justify-between items-end mb-8 border-b-[4px] border-sumi pb-4 relative z-10 gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] font-black text-sumi/50">{N5_SECTIONS[secKey].label[id ? 'id' : 'en']}</div>
            <div className="text-xs sm:text-sm uppercase tracking-[0.2em] font-bold text-sumi/60 mt-1">
              {id ? 'Soal' : 'Q'} <span className="text-ai text-base">{s.qIndex + 1}</span> / {section.items.length}
            </div>
          </div>
          <div className={`flex flex-col items-center px-4 py-2 border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] ${danger ? 'bg-shu text-kinari-light animate-pulse' : 'bg-kinari-light'}`}>
            <span className={`text-[9px] uppercase tracking-[0.25em] font-black ${danger ? 'text-kinari-light/70' : 'text-sumi/50'}`}>{id ? 'Waktu' : 'Time'}</span>
            <span className="text-xl font-serif font-black leading-tight">{formatClock(s.timeLeft ?? 0)}</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col relative z-10 pb-16">
          <div className="text-[10px] tracking-[0.2em] font-black text-shu/70 mb-4">
            {mondaiLabel(it.mondai)}
            <span className="ml-2 text-sumi/50 normal-case tracking-normal font-bold">— {mondaiGloss(it.mondai, language)}</span>
          </div>

          {it.passage && (
            <div className="border-[3px] border-sumi bg-kinari p-4 sm:p-6 mb-6 text-sm sm:text-base leading-loose text-sumi font-serif">
              <Furigana text={it.passage} />
            </div>
          )}

          {it.audio && (
            <div className="flex justify-center mb-6">
              <AudioPlayer audioSrc={it.audio} duration="0:30" />
            </div>
          )}

          <div className="text-base sm:text-lg font-bold text-sumi mb-6 whitespace-pre-line leading-relaxed">
            <Furigana text={it.prompt} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {it.options.map((option, idx) => {
              const isSel = s.selected === idx;
              const showCorrect = s.isAnswered && idx === it.correctIndex;
              const showWrong = s.isAnswered && isSel && !isCorrect;
              let cls = "bg-kinari border-[4px] border-sumi shadow-[6px_6px_0_0_rgba(26,26,26,1)] transition-all p-4 font-bold text-sumi flex items-start gap-3 text-sm sm:text-base text-left";
              if (!s.isAnswered) cls += " hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(26,26,26,1)] hover:bg-kinari-light cursor-pointer";
              else if (showCorrect) cls += " !bg-matcha !text-white translate-x-[2px] translate-y-[2px]";
              else if (showWrong) cls += " !bg-shu !text-white translate-x-[2px] translate-y-[2px]";
              else cls += " opacity-50";
              return (
                <motion.button
                  key={idx}
                  disabled={s.isAnswered}
                  onClick={() => s.chooseOption(idx)}
                  animate={showWrong ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={cls}
                >
                  <span className="inline-block w-6 text-xs font-sans text-sumi/60 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                  <span className="flex-1"><Furigana text={option} /></span>
                </motion.button>
              );
            })}
          </div>

          {s.isAnswered && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-6">
              <div className={`w-full py-3 px-4 font-bold text-sm border-[3px] mb-4 ${isCorrect ? 'bg-matcha/10 border-matcha text-matcha' : 'bg-shu/10 border-shu text-shu'}`}>
                {isCorrect ? (id ? '✓ Benar!' : '✓ Correct!') : (id ? '✗ Salah — Jawaban: ' : '✗ Wrong — Answer: ')}
                {!isCorrect && <Furigana text={it.answer} />}
              </div>
              {it.explanation && (
                <div className="border-[3px] border-sumi bg-kinari p-4 mb-4 text-xs sm:text-sm text-sumi/80 font-bold leading-relaxed">
                  <Furigana text={it.explanation} />
                </div>
              )}
              <button
                onClick={s.nextQuestion}
                className="w-full py-4 border-[4px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-[0.3em] text-sm shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {s.qIndex + 1 >= section.items.length ? (id ? 'Kumpul & Lanjut' : 'Submit & Next') : (id ? 'Lanjut' : 'Next')}
              </button>
            </motion.div>
          )}
        </div>
      </>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (s.phase === 'results' && s.result) {
    const r = s.result;
    const verdict = r.passed ? (id ? 'LULUS' : 'PASS') : (id ? 'GAGAL' : 'FAIL');
    return shell(
      <>
        {backBtn}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border-[4px] border-sumi bg-kinari-light shadow-[10px_10px_0_0_rgba(26,26,26,0.1)] relative z-10">
          <header className={`border-b-[4px] border-sumi p-8 text-center ${r.passed ? 'bg-matcha' : 'bg-shu'}`}>
            <div className="text-[10px] uppercase tracking-[0.4em] font-black text-kinari-light/80">{id ? 'Hasil Ujian N5' : 'N5 Exam Result'}</div>
            <div className="text-5xl sm:text-6xl font-serif font-black text-kinari-light tracking-tighter mt-2">{verdict}</div>
            <div className="text-kinari-light/90 font-bold mt-2 text-sm tracking-widest">{r.total} / 180</div>
          </header>

          <div className="p-6 sm:p-10">
            <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-sumi/50 mb-4">{id ? 'Skor per Seksi' : 'Section Scores'}</h3>
            <div className="flex flex-col gap-3 mb-8">
              <div className="border-[3px] border-sumi bg-kinari px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-sumi">{id ? 'Kosakata + Tata Bahasa + Membaca' : 'Vocab + Grammar + Reading'}</span>
                  <span className={`text-lg font-serif font-black ${r.lkrOk ? 'text-matcha' : 'text-shu'}`}>{r.lkrScaled} / {LKR_MAX}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-sumi/50 mt-1">{id ? `Ambang ${N5_PASS_LKR}` : `Pass ${N5_PASS_LKR}`} {r.lkrOk ? '✓' : '✗'} · {r.lkrRaw}/{r.lkrTotal} {id ? 'benar' : 'correct'}</div>
              </div>
              <div className="border-[3px] border-sumi bg-kinari px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-sumi">{id ? 'Menyimak' : 'Listening'}</span>
                  <span className={`text-lg font-serif font-black ${r.listeningOk ? 'text-matcha' : 'text-shu'}`}>{r.listeningScaled} / {LISTENING_MAX}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-sumi/50 mt-1">{id ? `Ambang ${N5_PASS_LISTENING}` : `Pass ${N5_PASS_LISTENING}`} {r.listeningOk ? '✓' : '✗'} · {r.listeningRaw}/{r.listeningTotal} {id ? 'benar' : 'correct'}</div>
              </div>
              <div className={`border-[3px] px-4 py-3 ${r.totalOk ? 'border-matcha bg-matcha/10' : 'border-shu bg-shu/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-sumi">{id ? 'TOTAL' : 'TOTAL'}</span>
                  <span className={`text-lg font-serif font-black ${r.totalOk ? 'text-matcha' : 'text-shu'}`}>{r.total} / 180</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-sumi/50 mt-1">{id ? `Ambang ${N5_PASS_TOTAL}` : `Pass ${N5_PASS_TOTAL}`} {r.totalOk ? '✓' : '✗'}</div>
              </div>
            </div>

            <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-sumi/50 mb-4">{id ? 'Rincian per Tipe Soal' : 'Breakdown by Question Type'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {r.perMondai.map((row) => (
                <div key={row.mondai} className="flex items-center justify-between border-[2px] border-sumi/30 px-3 py-2">
                  <span className="text-xs font-bold text-sumi/80">
                    {mondaiLabel(row.mondai)}
                    <span className="ml-1 text-sumi/50 font-medium normal-case">· {mondaiGloss(row.mondai, language)}</span>
                  </span>
                  <span className="text-xs font-black text-sumi">{row.correct}/{row.total}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={s.start}
                className="flex-1 py-4 border-[4px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-[0.25em] text-sm shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {id ? 'Ulangi Ujian' : 'Retry Exam'}
              </button>
              {r.passed && (
                <button
                  onClick={() => { s.quit(); navigate('/profile'); }}
                  className="flex-1 py-4 border-[4px] border-shu bg-shu text-kinari-light font-black uppercase tracking-[0.25em] text-sm shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer"
                >
                  {id ? 'Lihat Sertifikat' : 'View Certificate'}
                </button>
              )}
              <button
                onClick={() => { s.quit(); navigate('/'); }}
                className="flex-1 py-4 border-[4px] border-sumi bg-kinari text-sumi font-black uppercase tracking-[0.25em] text-sm shadow-[6px_6px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#1a1a1a] transition-all cursor-pointer"
              >
                {id ? 'Kembali ke Home' : 'Home'}
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  return null;
}
