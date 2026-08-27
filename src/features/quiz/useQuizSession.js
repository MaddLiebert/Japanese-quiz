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

function buildGrammarOptions(item, allGrammar, optionCount) {
  const pool = allGrammar.filter(d => d.id !== item.id);
  const sameCategory = shuffle(pool.filter(d => d.category === item.category));
  const others = shuffle(pool.filter(d => d.category !== item.category));
  const distractorItems = [...sameCategory, ...others].slice(0, optionCount - 1);
  const correctOption = { id: item.id, char: item.char, answer: item.answer, type: 'grammar' };
  const distractorOptions = distractorItems.map(d => ({
    id: d.id, char: d.char, answer: d.answer, type: 'grammar'
  }));
  return shuffle([...distractorOptions, correctOption]);
}

function buildKotobaOptions(item, allKotoba, optionCount) {
  const pool = allKotoba.filter(d => d.id !== item.id);
  const sameCategory = shuffle(pool.filter(d => d.category === item.category));
  const others = shuffle(pool.filter(d => d.category !== item.category));
  const distractorItems = [...sameCategory, ...others].slice(0, optionCount - 1);
  const correctOption = {
    id: item.id, meaning: item.meaning, meaning_id: item.meaning_id,
    romaji: item.romaji, type: 'kotoba', isCorrect: true
  };
  const distractorOptions = distractorItems.map(d => ({
    id: d.id, meaning: d.meaning, meaning_id: d.meaning_id,
    romaji: d.romaji, type: 'kotoba', isCorrect: false
  }));
  return shuffle([...distractorOptions, correctOption]);
}

function buildKanjiOptions(item, allKanji, optionCount) {
  const pool = allKanji.filter(d => d.id !== item.id);
  const sameCategory = shuffle(pool.filter(d => d.category === item.category));
  const others = shuffle(pool.filter(d => d.category !== item.category));
  const distractorItems = [...sameCategory, ...others].slice(0, optionCount - 1);
  const correctOption = {
    id: item.id, meaning: item.meaning, meaning_id: item.meaning_id,
    onyomi: item.onyomi, kunyomi: item.kunyomi, type: 'kanji', isCorrect: true
  };
  const distractorOptions = distractorItems.map(d => ({
    id: d.id, meaning: d.meaning, meaning_id: d.meaning_id,
    onyomi: d.onyomi, kunyomi: d.kunyomi, type: 'kanji', isCorrect: false
  }));
  return shuffle([...distractorOptions, correctOption]);
}

function buildKanaOptions(item, typeData, optionCount) {
  const distractors = shuffle(typeData.filter(d => d.id !== item.id)).slice(0, optionCount - 1);
  return shuffle([...distractors, item]);
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
      let options;
      if (item.type === 'grammar') {
        options = buildGrammarOptions(item, grammarData, optionCount);
      } else if (item.type === 'kotoba') {
        options = buildKotobaOptions(item, kotobaData, optionCount);
      } else if (item.type === 'kanji') {
        options = buildKanjiOptions(item, kanjiData, optionCount);
      } else {
        const typeData = item.type === 'katakana' ? katakanaData : hiraganaData;
        options = buildKanaOptions(item, typeData, optionCount);
      }
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
