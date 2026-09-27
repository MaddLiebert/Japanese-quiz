import { useState, useCallback, useRef, useEffect } from 'react';
import { useItemProgress, useUserStats } from '../progress/ProgressContext';
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import kotobaData from '../../data/kotoba.json';
import grammarData from '../../data/grammar.json';
import kanjiData from '../../data/kanji.json';
import { shuffle, buildOptions } from './questionBuilder';

// Dataset lengkap untuk fallback distractor (dipakai questionBuilder).
const DATASETS = { hiragana: hiraganaData, katakana: katakanaData, kotoba: kotobaData, grammar: grammarData, kanji: kanjiData };

// `frozen` (opsional): saat true, countdown Hard mode DIBEKUKAN (tidak
// berkurang) — dipakai domain Gojo 無量空処 (waktu kuis beku selama domain).
export function useQuizSession({ frozen = false } = {}) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [answeredId, setAnsweredId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Use refs to hold latest state for use inside callbacks without stale closures
  const questionsRef = useRef([]);
  const difficultyRef = useRef('easy');
  const currentIndexRef = useRef(0);
  const isAnsweredRef = useRef(false);
  const timeoutRef = useRef(null);
  const scoreRef = useRef(0);
  
  const { recordAnswer } = useItemProgress();
  const { completeQuiz } = useUserStats();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const initializeQuiz = useCallback((config) => {
    const { mode, pools, rows, difficulty, sourceData = hiraganaData, itemIds } = config;

    let availableItems = [];
    if (itemIds) {
      const allData = [...hiraganaData, ...katakanaData, ...kotobaData, ...grammarData, ...kanjiData];
      availableItems = allData.filter(item => itemIds.includes(item.id));
    } else if (mode === 'mixed') {
      if (pools.includes('hiragana')) availableItems.push(...hiraganaData);
      if (pools.includes('katakana')) availableItems.push(...katakanaData);
      if (pools.includes('kotoba')) availableItems.push(...kotobaData);
      if (pools.includes('kanji')) availableItems.push(...kanjiData);
      if (pools.includes('grammar')) availableItems.push(...grammarData);
      availableItems = shuffle(availableItems);
      if (difficulty === 'Easy') availableItems = availableItems.slice(0, 20);
      else if (difficulty === 'Medium') availableItems = availableItems.slice(0, 30);
      else availableItems = availableItems.slice(0, 50);
    } else {
      availableItems = sourceData.filter(item => {
        const key = (item.type === 'kotoba' || item.type === 'grammar' || item.type === 'kanji')
          ? item.category : item.row;
        return rows.includes(key);
      });
    }

    if (availableItems.length === 0) return;

    const diff = (difficulty || 'easy').toLowerCase();
    difficultyRef.current = diff;

    let optionCount = 4;
    if (diff === 'easy') optionCount = 4;
    if (diff === 'medium' || diff === 'hard') optionCount = 6;

    const shuffledItems = shuffle(availableItems);
    const generatedQuestions = shuffledItems.map(item => {
      const options = buildOptions(item, availableItems, optionCount, DATASETS);
      return { target: item, options };
    });

    questionsRef.current = generatedQuestions;
    currentIndexRef.current = 0;
    isAnsweredRef.current = false;
    scoreRef.current = 0;

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setWrongAnswers([]);
    setAnsweredId(null);
    setIsAnswered(false);
    setTimeLeft(diff === 'hard' ? 7 : null);
  }, []);

  // Hard mode timer countdown — BEKU saat `frozen` (domain Gojo aktif):
  // tidak ada interval yang berjalan, sisa waktu persis seperti saat dibekukan.
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isAnsweredRef.current || isFinished) return;
    if (frozen) return;   // ❄ waktu beku — countdown pause, bukan reset

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, frozen]);

  // Handle timer expiration (tidak pernah kena saat frozen: timeLeft tak
  // mencapai 0 karena countdown pause).
  useEffect(() => {
    if (timeLeft === 0 && !isAnsweredRef.current && !isFinished) {
      isAnsweredRef.current = true;
      setIsAnswered(true);
      setAnsweredId(null); // No option selected
      
      const currentQ = questionsRef.current[currentIndexRef.current];
      if (currentQ) {
    recordAnswer(currentQ.target.id, false, 0); // 0 XP for timeout
        setWrongAnswers(prev => [...prev, currentQ.target.id]);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          advanceQuestion();
        }, 800);
      }
    }
  }, [timeLeft, isFinished, recordAnswer]);

  // selectAnswer: records the click, updates score. Uses refs to avoid stale closures.
  const selectAnswer = useCallback((selectedOptionId) => {
    if (isAnsweredRef.current) return; // prevent double-click via ref (always fresh)
    isAnsweredRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setAnsweredId(selectedOptionId);
    setIsAnswered(true);

    const currentQ = questionsRef.current[currentIndexRef.current];
    if (!currentQ) return;

    const correct = selectedOptionId === currentQ.target.id;
    
    let xpReward = 10;
    if (difficultyRef.current === 'medium') xpReward = 20;
    if (difficultyRef.current === 'hard') xpReward = 35;

    // Record to persistent storage
    recordAnswer(currentQ.target.id, correct, xpReward);

    if (correct) {
      scoreRef.current += 1;
      setScore(prev => prev + 1);
    } else {
      setWrongAnswers(prev => [...prev, currentQ.target.id]);
    }
  }, [recordAnswer]); // reads from refs except for recordAnswer

  // advanceQuestion: moves to next question. Uses refs.
  const advanceQuestion = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    isAnsweredRef.current = false;
    setAnsweredId(null);
    setIsAnswered(false);

    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < questionsRef.current.length) {
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      if (difficultyRef.current === 'hard') {
        setTimeLeft(7);
      }
    } else {
      setIsFinished(true);
      const total = questionsRef.current.length;
      const finalScore = scoreRef.current;
      const wrongCount = total - finalScore;
      const isWin = finalScore >= Math.ceil(total / 2);
      completeQuiz(isWin, difficultyRef.current, 1, wrongCount, total);
    }
  }, [completeQuiz]); // reads from refs except for completeQuiz

  // Legacy shim for kana mode: select + auto-advance after 1500ms
  const answerQuestion = useCallback((selectedOptionId) => {
    selectAnswer(selectedOptionId);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      advanceQuestion();
    }, 1500);
  }, [selectAnswer, advanceQuestion]);

  const currentQ = questions[currentIndex] || null;
  const isCurrentAnswerCorrect = isAnswered && currentQ
    ? answeredId === currentQ.target.id
    : null;

  return {
    questions,
    currentIndex,
    score,
    isFinished,
    wrongAnswers,
    initializeQuiz,
    selectAnswer,
    advanceQuestion,
    answeredId,
    isAnswered,
    isCurrentAnswerCorrect,
    answerQuestion, // legacy shim for kana
    currentQuestion: currentQ ? currentQ.target : null,
    options: currentQ ? currentQ.options : [],
    totalQuestions: questions.length,
    timeLeft,
  };
}
