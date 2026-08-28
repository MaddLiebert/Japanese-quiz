import { useState, useCallback, useRef, useEffect } from 'react';
import { useItemProgress } from '../progress/ProgressContext';
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import kotobaData from '../../data/kotoba.json';
import grammarData from '../../data/grammar.json';
import kanjiData from '../../data/kanji.json';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Global data lookup by type (used for fallback only) ──────────────────────
const GLOBAL_DATA_BY_TYPE = {
  hiragana: hiraganaData,
  katakana: katakanaData,
  kotoba: kotobaData,
  grammar: grammarData,
  kanji: kanjiData,
};

// ── Smart Distractor Builder ─────────────────────────────────────────────────
// Picks distractors using a 3-tier priority:
//   1. Same row/category inside the user's quiz pool
//   2. Different row/category inside the user's quiz pool
//   3. Global fallback (type-matched, avoids cross-category contamination)
function pickDistractors(item, quizPool, optionCount) {
  const needed = optionCount - 1;
  const groupKey = (item.type === 'kotoba' || item.type === 'grammar' || item.type === 'kanji')
    ? 'category' : 'row';

  // Tier 1 & 2: from the user's quiz pool (excluding the current item)
  const poolWithoutSelf = quizPool.filter(d => d.id !== item.id);
  const sameGroup  = shuffle(poolWithoutSelf.filter(d => d[groupKey] === item[groupKey]));
  const otherGroup = shuffle(poolWithoutSelf.filter(d => d[groupKey] !== item[groupKey]));

  const picked = [...sameGroup, ...otherGroup].slice(0, needed);

  // Tier 3: if the user's pool is too small, pull from the global dataset
  if (picked.length < needed) {
    const usedIds = new Set([item.id, ...picked.map(d => d.id)]);
    const globalPool = (GLOBAL_DATA_BY_TYPE[item.type] || []).filter(d => {
      if (usedIds.has(d.id)) return false;
      // For kana: match the same type and avoid mixing standard vs digraph/dakuten rows
      if (item.type === 'hiragana' || item.type === 'katakana') {
        return d.type === item.type;
      }
      // For kotoba/grammar/kanji: match type (already guaranteed by GLOBAL_DATA_BY_TYPE key)
      return true;
    });
    const extras = shuffle(globalPool).slice(0, needed - picked.length);
    picked.push(...extras);
  }

  return picked;
}

// ── Option formatters (shape the distractor data into what the UI expects) ───
function toOptionShape(d) {
  if (d.type === 'grammar') {
    return { id: d.id, char: d.char, answer: d.answer, type: 'grammar' };
  }
  if (d.type === 'kotoba') {
    return { id: d.id, meaning: d.meaning, meaning_id: d.meaning_id, romaji: d.romaji, type: 'kotoba', isCorrect: false };
  }
  if (d.type === 'kanji') {
    return { id: d.id, meaning: d.meaning, meaning_id: d.meaning_id, onyomi: d.onyomi, kunyomi: d.kunyomi, type: 'kanji', isCorrect: false };
  }
  // kana — pass through (UI reads .id, .char, .romaji directly)
  return d;
}

function buildOptions(item, quizPool, optionCount) {
  const distractors = pickDistractors(item, quizPool, optionCount);

  // Build the correct-answer option with the right shape
  let correctOption;
  if (item.type === 'grammar') {
    correctOption = { id: item.id, char: item.char, answer: item.answer, type: 'grammar' };
  } else if (item.type === 'kotoba') {
    correctOption = { id: item.id, meaning: item.meaning, meaning_id: item.meaning_id, romaji: item.romaji, type: 'kotoba', isCorrect: true };
  } else if (item.type === 'kanji') {
    correctOption = { id: item.id, meaning: item.meaning, meaning_id: item.meaning_id, onyomi: item.onyomi, kunyomi: item.kunyomi, type: 'kanji', isCorrect: true };
  } else {
    correctOption = item; // kana
  }

  const distractorOptions = distractors.map(toOptionShape);
  return shuffle([...distractorOptions, correctOption]);
}

export function useQuizSession() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [answeredId, setAnsweredId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Use refs to hold latest state for use inside callbacks without stale closures
  const questionsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const isAnsweredRef = useRef(false);
  const timeoutRef = useRef(null);
  
  const { recordAnswer } = useItemProgress();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const initializeQuiz = useCallback((config) => {
    const { mode, pools, rows, difficulty, sourceData = hiraganaData } = config;

    let availableItems = [];
    if (mode === 'mixed') {
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

    let optionCount = 4;
    if (difficulty === 'Easy') optionCount = 3;
    if (difficulty === 'Hard') optionCount = 6;

    const shuffledItems = shuffle(availableItems);
    const generatedQuestions = shuffledItems.map(item => {
      const options = buildOptions(item, availableItems, optionCount);
      return { target: item, options };
    });

    questionsRef.current = generatedQuestions;
    currentIndexRef.current = 0;
    isAnsweredRef.current = false;

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setWrongAnswers([]);
    setAnsweredId(null);
    setIsAnswered(false);
  }, []);

  // selectAnswer: records the click, updates score. Uses refs to avoid stale closures.
  const selectAnswer = useCallback((selectedOptionId) => {
    if (isAnsweredRef.current) return; // prevent double-click via ref (always fresh)
    isAnsweredRef.current = true;

    setAnsweredId(selectedOptionId);
    setIsAnswered(true);

    const currentQ = questionsRef.current[currentIndexRef.current];
    if (!currentQ) return;

    const correct = selectedOptionId === currentQ.target.id;
    
    // Record to persistent storage
    recordAnswer(currentQ.target.id, correct);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
      setWrongAnswers(prev => [...prev, currentQ.target.id]);
    }
  }, [recordAnswer]); // reads from refs except for recordAnswer

  // advanceQuestion: moves to next question. Uses refs.
  const advanceQuestion = useCallback(() => {
    isAnsweredRef.current = false;
    setAnsweredId(null);
    setIsAnswered(false);

    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < questionsRef.current.length) {
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    } else {
      setIsFinished(true);
    }
  }, []); // no deps needed — reads from refs

  // Legacy shim for kana mode: select + auto-advance after 800ms
  const answerQuestion = useCallback((selectedOptionId) => {
    selectAnswer(selectedOptionId);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      advanceQuestion();
    }, 800);
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
  };
}
