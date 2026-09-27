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

// Fase: 'intro' → 'section' ⇄ 'sectionBreak' → 'results'
export function useN5Exam() {
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

  const currentSection = exam[sectionIndex] || null;
  const currentItem = currentSection ? currentSection.items[qIndex] : null;

  // Offset global soal = total soal seksi-seksi sebelumnya (untuk index answers).
  const flatOffset = (si) =>
    examRef.current.slice(0, si).reduce((s, x) => s + x.items.length, 0);

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
    setTimeLeft(N5_SECTIONS[N5_SECTION_ORDER[0]].minutes * 60);
    setPhase('section');
  }, [resetEffectStreak]);

  // Timer seksi — jalan hanya saat fase 'section'. Reset tiap ganti seksi.
  useEffect(() => {
    if (phase !== 'section') return undefined;
    const t = setInterval(() => {
      setTimeLeft((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const finish = useCallback(() => {
    const scored = scoreExam(examRef.current, answersRef.current);
    const totalQ = answersRef.current.length;
    const correct = answersRef.current.filter(Boolean).length;
    completeQuiz(scored.passed, 'hard', 1, totalQ - correct, totalQ);
    // Simpan rekor ujian → memicu badge 合格/優良/満点 + sertifikat (sekali per run).
    recordN5Exam({
      total: scored.total,
      lkrScaled: scored.lkrScaled,
      listeningScaled: scored.listeningScaled,
      passed: scored.passed,
      at: new Date().toISOString(),
    });
    setResult(scored);
    setPhase('results');
  }, [completeQuiz, recordN5Exam]);

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
    triggerEffect(correct ? 'correct' : 'wrong');
  }, [isAnswered, currentItem, recordAnswer, triggerEffect]);

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
    setTimeLeft(N5_SECTIONS[key].minutes * 60);
    setPhase('section');
  }, []);

  const quit = useCallback(() => {
    examRef.current = [];
    answersRef.current = [];
    setPhase('intro');
    setExam([]);
    setResult(null);
  }, []);

  return {
    phase, exam, currentSection, currentItem, sectionIndex, qIndex,
    selected, isAnswered, timeLeft, result, lastTimedOut,
    start, chooseOption, nextQuestion, continueToNextSection, quit,
  };
}
