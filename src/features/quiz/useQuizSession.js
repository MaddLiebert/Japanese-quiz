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
    const targetDataset = item.id?.startsWith('hira_') ? hiraganaData
      : item.id?.startsWith('kata_') ? katakanaData
      : GLOBAL_DATA_BY_TYPE[item.type] || [];
    const globalPool = targetDataset.filter(d => {
      if (usedIds.has(d.id)) return false;
      // For kana: match the same type (e.g. seion, dakuon, handakuon, yoon) when possible
      if (item.id?.startsWith('hira_') || item.id?.startsWith('kata_')) {
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
  const [timeLeft, setTimeLeft] = useState(null);

  // Use refs to hold latest state for use inside callbacks without stale closures
  const questionsRef = useRef([]);
  const difficultyRef = useRef('easy');
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
    setTimeLeft(diff === 'hard' ? 7 : null);
  }, []);

  // Hard mode timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isAnsweredRef.current || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  // Handle timer expiration
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
      if (difficultyRef.current === 'hard') {
        setTimeLeft(7);
      }
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
    timeLeft,
  };
}
