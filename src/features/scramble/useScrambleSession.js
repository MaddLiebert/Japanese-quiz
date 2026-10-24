import { useState, useCallback, useRef, useEffect } from 'react';
import { useItemProgress } from '../progress/ProgressContext';
import bank from '../../data/sentenceScramble.json';
import { buildScrambleSession, isCorrectOrder } from './scramble';

// ─────────────────────────────────────────────────────────────────────────────
// useScrambleSession — state sesi "Susun Balok".
// Alur: susun balok → Periksa → benar/salah → Soal Berikutnya.
// XP & progres dicatat lewat ProgressContext (pola sama dengan useQuizSession).
// ─────────────────────────────────────────────────────────────────────────────
const XP_BY_DIFFICULTY = { easy: 10, medium: 20, hard: 35 };

export function useScrambleSession() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState([]);        // deret key balok di papan
  const [checked, setChecked] = useState(false);   // sudah diperiksa?
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const questionsRef = useRef([]);
  const indexRef = useRef(0);
  const placedRef = useRef([]);
  const scoreRef = useRef(0);
  const difficultyRef = useRef('medium');

  const { recordAnswer } = useItemProgress();

  // ── Mulai sesi baru ───────────────────────────────────────────────────────
  const startSession = useCallback(({ language = 'id', categories = null, count = 10, difficulty = 'medium' } = {}) => {
    const session = buildScrambleSession(bank.items, {
      language, count, categories,
    });
    if (session.length === 0) return false;

    difficultyRef.current = String(difficulty).toLowerCase();
    questionsRef.current = session;
    indexRef.current = 0;
    placedRef.current = [];
    scoreRef.current = 0;

    setQuestions(session);
    setCurrentIndex(0);
    setPlaced([]);
    setChecked(false);
    setIsCorrect(null);
    setScore(0);
    setWrongIds([]);
    setIsFinished(false);
    return true;
  }, []);

  const currentQuestion = questions[currentIndex] || null;

  // ── Pasang / lepas balok ──────────────────────────────────────────────────
  const placeBlock = useCallback((key) => {
    if (placedRef.current.includes(key)) return;
    placedRef.current = [...placedRef.current, key];
    setPlaced(placedRef.current);
  }, []);

  const removeBlock = useCallback((key) => {
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
    if (!q) return null;
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
      setChecked(false);
      setIsCorrect(null);
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
