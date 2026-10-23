import { useState, useCallback, useRef, useEffect } from 'react';
import { useItemProgress, useUserStats } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import kanjiData from '../../data/kanji.json';
import grammarData from '../../data/grammar.json';
import kotobaData from '../../data/kotoba.json';
import mondaiData from '../../data/mondai.json';
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import bank from '../../data/n5-exam.json';
import { buildExam, scoreExam, N5_SECTIONS, N5_SECTION_ORDER } from './n5exam.js';

// Dataset lengkap untuk builder (auto-generate tipe kanji/grammar/mondai).
const DATASETS = {
  kanji: kanjiData,
  grammar: grammarData,
  kotoba: kotobaData,
  mondai: mondaiData,
  hiragana: hiraganaData,
  katakana: katakanaData,
};

const XP_PER_CORRECT = 15; // konsisten dengan MondaiQuiz

// Sesi ujian disimpan di localStorage → refresh/HP mati tidak menghanguskan
// 78 jawaban. Dipisah per mode supaya ujian 終 tidak menimpa N5 biasa.
// ponytail: localStorage (bukan IndexedDB) — payload ~40 KB, cukup.
const sessionKey = (cold) => `n5_exam_session_v1:${cold ? 'owari' : 'n5'}`;
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const loadSession = (key) => {
  try {
    const s = JSON.parse(localStorage.getItem(key) || 'null');
    if (!s?.exam?.length || !Array.isArray(s.answers)) return null;
    if (Date.now() - (s.at || 0) > SESSION_MAX_AGE_MS) return null;
    return s;
  } catch {
    return null;
  }
};

// Fase: 'intro' → 'section' ⇄ 'sectionBreak' → 'results'
// opts (gerbang 終 電脳): { cold, evaluate, sectionMinutes(fn) }.
// Default = N5 biasa (cold off, ambang N5, durasi N5) → pemanggil lama tak berubah.
export function useN5Exam(opts = {}) {
  const { cold = false, evaluate, sectionMinutes } = opts;
  const [phase, setPhase] = useState('intro');
  const [exam, setExam] = useState([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);   // index opsi terpilih (per soal)
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);   // detik seksi berjalan
  const [result, setResult] = useState(null);
  const [lastTimedOut, setLastTimedOut] = useState(false);

  // Refs untuk hindari stale closure (pola useQuizSession / useDeathQuizSession).
  const examRef = useRef([]);
  const answersRef = useRef([]);      // boolean sejajar urutan global (semua seksi)
  const sectionRef = useRef(0);
  const qRef = useRef(0);
  const phaseRef = useRef('intro');

  const { recordAnswer } = useItemProgress();
  const { completeQuiz, recordN5Exam } = useUserStats();
  const { triggerEffect, resetEffectStreak } = useEffectLayer();

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { sectionRef.current = sectionIndex; }, [sectionIndex]);
  useEffect(() => { qRef.current = qIndex; }, [qIndex]);

  // ── Persist sesi ──────────────────────────────────────────────────────────
  const key = sessionKey(cold);
  const [restored, setRestored] = useState(false);

  // Pulihkan sekali saat mount: refresh / HP mati di tengah ujian → lanjut.
  // Timer ikut nilai tersimpan (ujian dianggap pause, bukan jalan di latar).
  useEffect(() => {
    const s = loadSession(key);
    if (!s) { setRestored(true); return; }
    examRef.current = s.exam;
    answersRef.current = s.answers;
    sectionRef.current = s.sectionIndex || 0;
    qRef.current = s.qIndex || 0;
    setExam(s.exam);
    setSectionIndex(s.sectionIndex || 0);
    setQIndex(s.qIndex || 0);
    setSelected(s.selected ?? null);
    setIsAnswered(!!s.isAnswered);
    setTimeLeft(s.timeLeft ?? null);
    setPhase(s.phase === 'sectionBreak' ? 'sectionBreak' : 'section');
    setRestored(true);
  }, [key]);

  // Simpan tiap perubahan yang berarti. Guard `restored` supaya efek ini tidak
  // menulis sesi kosong sebelum pemulihan selesai (race di mount pertama).
  useEffect(() => {
    if (!restored) return;
    if (phase !== 'section' && phase !== 'sectionBreak') return;
    try {
      localStorage.setItem(key, JSON.stringify({
        exam, answers: answersRef.current, sectionIndex, qIndex,
        selected, isAnswered, timeLeft, phase, at: Date.now(),
      }));
    } catch { /* quota penuh → ujian jalan terus, cuma tak bisa dipulihkan */ }
  }, [restored, key, phase, exam, sectionIndex, qIndex, selected, isAnswered, timeLeft]);

  const clearSession = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* abaikan */ }
  }, [key]);

  const currentSection = exam[sectionIndex] || null;
  const currentItem = currentSection ? currentSection.items[qIndex] : null;

  // Offset global soal = total soal seksi-seksi sebelumnya (untuk index answers).
  const flatOffset = (si) =>
    examRef.current.slice(0, si).reduce((s, x) => s + x.items.length, 0);

  // Durasi seksi (menit): override gerbang 終 (waktu ketat) atau durasi N5.
  // useCallback → stabil, aman dipakai sebagai dependency useCallback lain.
  const minutesFor = useCallback(
    (key) => (sectionMinutes ? sectionMinutes(key) : N5_SECTIONS[key].minutes),
    [sectionMinutes],
  );

  const start = useCallback(() => {
    const built = buildExam(bank, DATASETS);
    examRef.current = built;
    answersRef.current = new Array(built.reduce((s, x) => s + x.items.length, 0)).fill(false);
    resetEffectStreak();
    sectionRef.current = 0;
    qRef.current = 0;
    setExam(built);
    setSectionIndex(0);
    setQIndex(0);
    setSelected(null);
    setIsAnswered(false);
    setLastTimedOut(false);
    setResult(null);
    setTimeLeft(minutesFor(N5_SECTION_ORDER[0]) * 60);
    setPhase('section');
    setRestored(true);   // sesi baru → efek persist boleh menulis
  }, [resetEffectStreak, minutesFor]);

  // Timer seksi — jalan hanya saat fase 'section'. Reset tiap ganti seksi.
  useEffect(() => {
    if (phase !== 'section') return undefined;
    const t = setInterval(() => {
      setTimeLeft((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const finish = useCallback(() => {
    const scored = scoreExam(examRef.current, answersRef.current, evaluate);
    const totalQ = answersRef.current.length;
    const correct = answersRef.current.filter(Boolean).length;
    completeQuiz(scored.passed, 'hard', 1, totalQ - correct, totalQ);
    // Simpan rekor ujian → memicu badge 合格/優良/満点 + sertifikat (sekali per run).
    // Gerbang 終 (電脳) memakai JALUR YANG SAMA: lulus 終 = hadiah N5Certificate
    // (PRD §11). Ambangnya beda (lewat `evaluate`), tapi hadiahnya sama.
    recordN5Exam({
      total: scored.total,
      lkrScaled: scored.lkrScaled,
      listeningScaled: scored.listeningScaled,
      passed: scored.passed,
      at: new Date().toISOString(),
    });
    setResult(scored);
    setPhase('results');
    clearSession();   // ujian selesai → jangan ditawari lanjut sesi lama
  }, [completeQuiz, recordN5Exam, evaluate, clearSession]);

  // Akhiri seksi sekarang: maju ke jeda (seksi berikutnya) atau ke hasil.
  const endSection = useCallback((timedOut) => {
    const si = sectionRef.current;
    if (si + 1 < examRef.current.length) {
      setLastTimedOut(timedOut);
      setPhase('sectionBreak');
    } else {
      finish();
    }
  }, [finish]);

  // Auto-submit saat waktu seksi habis (soal belum dijawab tetap salah).
  useEffect(() => {
    if (phase === 'section' && timeLeft === 0) endSection(true);
  }, [phase, timeLeft, endSection]);

  const chooseOption = useCallback((optIndex) => {
    if (isAnswered || !currentItem) return;
    const correct = optIndex === currentItem.correctIndex;
    const g = flatOffset(sectionRef.current) + qRef.current;
    answersRef.current[g] = correct;
    setSelected(optIndex);
    setIsAnswered(true);
    recordAnswer(currentItem.id, correct, XP_PER_CORRECT);
    // Mode dingin (gerbang 終): TANPA umpan balik benar/salah — suara & efek ditahan
    // sampai hasil akhir, supaya pemain tak bisa menyetel jawaban dari reaksi.
    if (!cold) triggerEffect(correct ? 'correct' : 'wrong');
  }, [isAnswered, currentItem, recordAnswer, triggerEffect, cold]);

  const nextQuestion = useCallback(() => {
    const cur = examRef.current[sectionRef.current];
    if (!cur) return;
    if (qRef.current + 1 < cur.items.length) {
      setQIndex(qRef.current + 1);
      setSelected(null);
      setIsAnswered(false);
    } else {
      endSection(false);
    }
  }, [endSection]);

  const continueToNextSection = useCallback(() => {
    const next = sectionRef.current + 1;
    const key = N5_SECTION_ORDER[next];
    sectionRef.current = next;
    qRef.current = 0;
    setSectionIndex(next);
    setQIndex(0);
    setSelected(null);
    setIsAnswered(false);
    setLastTimedOut(false);
    setTimeLeft(minutesFor(key) * 60);
    setPhase('section');
  }, [minutesFor]);

  const quit = useCallback(() => {
    examRef.current = [];
    answersRef.current = [];
    clearSession();
    setPhase('intro');
    setExam([]);
    setResult(null);
  }, [clearSession]);

  return {
    phase, exam, currentSection, currentItem, sectionIndex, qIndex,
    selected, isAnswered, timeLeft, result, lastTimedOut,
    start, chooseOption, nextQuestion, continueToNextSection, quit,
  };
}
