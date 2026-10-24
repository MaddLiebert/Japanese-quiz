import { useState, useCallback, useRef, useEffect } from 'react';
import { useItemProgress } from '../progress/ProgressContext';
import bank from '../../data/sentenceScramble.json';
import { buildScrambleSession, isCorrectOrder } from './scramble';

// ─────────────────────────────────────────────────────────────────────────────
// useScrambleSession — state sesi "Susun Balok" (Duolingo-style).
// Alur: susun balok → Periksa → benar/salah → Soal Berikutnya.
// Tiap soal punya TIMER 7 detik — habis = dianggap salah + auto lanjut.
// XP & progres dicatat lewat ProgressContext (pola sama dengan useQuizSession).
// ─────────────────────────────────────────────────────────────────────────────
const XP_BY_DIFFICULTY = { easy: 10, medium: 20, hard: 35 };
const TIME_PER_QUESTION = 7;

export function useScrambleSession() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState([]);        // deret key balok di papan
  const [checked, setChecked] = useState(false);   // sudah diperiksa?
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const questionsRef = useRef([]);
  const indexRef = useRef(0);
  const placedRef = useRef([]);
  const scoreRef = useRef(0);
  const difficultyRef = useRef('easy');
  const checkedRef = useRef(false);
  const timeoutRef = useRef(null);

  const { recordAnswer } = useItemProgress();

  // ── Mulai sesi baru ───────────────────────────────────────────────────────
  const startSession = useCallback(({ language = 'id', categories = null, count = 10, difficulty = 'easy' } = {}) => {
    const session = buildScrambleSession(bank.items, {
      language, count, categories, difficulty,
    });
    if (session.length === 0) return false;

    difficultyRef.current = String(difficulty).toLowerCase();
    questionsRef.current = session;
    indexRef.current = 0;
    placedRef.current = [];
    scoreRef.current = 0;
    checkedRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setQuestions(session);
    setCurrentIndex(0);
    setPlaced([]);
    setChecked(false);
    setIsCorrect(null);
    setTimeLeft(TIME_PER_QUESTION);
    setScore(0);
    setWrongIds([]);
    setIsFinished(false);
    return true;
  }, []);

  const currentQuestion = questions[currentIndex] || null;

  // ── Countdown tiap soal: 7 detik per soal ────────────────────────────────
  useEffect(() => {
    if (checkedRef.current || isFinished) return;
    if (timeLeft <= 0) {
      // waktu habis → otomatis salah + lanjut
      const q = questionsRef.current[indexRef.current];
      if (q && !checkedRef.current) {
        checkedRef.current = true;
        setChecked(true);
        setIsCorrect(false);
        recordAnswer(q.sourceId, false, 0);
        setWrongIds((prev) => [...prev, q.sourceId]);
        timeoutRef.current = setTimeout(() => nextQuestion(), 900);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isFinished, recordAnswer]);

  // ── Pasang / lepas balok ──────────────────────────────────────────────────
  const placeBlock = useCallback((key) => {
    if (checkedRef.current || placedRef.current.includes(key)) return;
    placedRef.current = [...placedRef.current, key];
    setPlaced(placedRef.current);
  }, []);

  const removeBlock = useCallback((key) => {
    if (checkedRef.current) return;
    placedRef.current = placedRef.current.filter((k) => k !== key);
    setPlaced(placedRef.current);
  }, []);

  const clearPlaced = useCallback(() => {
    placedRef.current = [];
    setPlaced([]);
  }, []);

  // ── Periksa jawaban ───────────────────────────────────────────────────────
  const checkAnswer = useCallback(() => {
    const q = questionsRef.current[indexRef.current];
    if (!q || checkedRef.current) return null;
    if (placedRef.current.length !== q.answerKeys.length) return null; // belum lengkap
    checkedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const ok = isCorrectOrder(placedRef.current, q.answerKeys);
    const xp = XP_BY_DIFFICULTY[difficultyRef.current] ?? 20;

    setChecked(true);
    setIsCorrect(ok);
    recordAnswer(q.sourceId, ok, ok ? xp : 0);

    if (ok) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      setWrongIds((prev) => [...prev, q.sourceId]);
    }
    return ok;
  }, [recordAnswer]);

  // ── Soal berikutnya ───────────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    const next = indexRef.current + 1;
    if (next < questionsRef.current.length) {
      indexRef.current = next;
      setCurrentIndex(next);
      placedRef.current = [];
      setPlaced([]);
      checkedRef.current = false;
      setChecked(false);
      setIsCorrect(null);
      setTimeLeft(TIME_PER_QUESTION);
      setWrongIds((prev) => prev); // tidak reset — akumulasi salah sesi
    } else {
      setIsFinished(true);
    }
  }, []);

  return {
    questions,
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    placed,
    checked,
    isCorrect,
    timeLeft,
    score,
    wrongIds,
    isFinished,
    startSession,
    placeBlock,
    removeBlock,
    clearPlaced,
    checkAnswer,
    nextQuestion,
  };
}

