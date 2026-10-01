import { useState, useCallback, useRef, useEffect } from 'react';
import { useItemProgress, useUserStats } from '../progress/ProgressContext';
import { useEffectLayer } from '../effects/EffectContext';
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import kotobaData from '../../data/kotoba.json';
import grammarData from '../../data/grammar.json';
import kanjiData from '../../data/kanji.json';
import { buildOptions } from '../quiz/questionBuilder';
import {
  DEATH_START_LIVES,
  DEATH_TIMER_S,
  DEATH_XP_PER_CORRECT,
  DEATH_XP_PENALTY,
  allQuizItems,
  drawNextDeathItem,
  deathMedaruReward,
} from './deathQuiz';
import {
  DEATH_MUGEN_BONUS_S,
  deathSkillById,
  deathInitialSkillState,
  deathSkillOnCorrect,
  deathSkillOnWrong,
  deathSkillCanCast,
  deathSkillSpend,
  deathComboBonus,
} from './deathSkills';

const DATASETS = {
  hiragana: hiraganaData,
  katakana: katakanaData,
  kotoba: kotobaData,
  grammar: grammarData,
  kanji: kanjiData,
};

const ALL_ITEMS = allQuizItems(DATASETS);

// Jeda antar soal (ms) — mengikuti pola kuis biasa (kana 1500, kotoba manual).
const CORRECT_ADVANCE_MS = 900;
const WRONG_ADVANCE_MS = 1500;

// Fase sesi: 'intro' → 'playing' ⇄ 'revive' → 'gameover'
export function useDeathQuizSession() {
  const [phase, setPhase] = useState('intro');
  const [current, setCurrent] = useState(null);   // { target, options }
  const [lives, setLives] = useState(DEATH_START_LIVES);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answeredId, setAnsweredId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { correct, itemId }
  const [runResult, setRunResult] = useState(null);   // { score, penaltyApplied, usedJumpers }
  const [skillState, setSkillState] = useState(deathInitialSkillState); // { combo, meter, charges }
  const [eliminatedIds, setEliminatedIds] = useState([]); // opsi yang dibuang 六眼 (soal aktif)
  const [lastCast, setLastCast] = useState(null);         // { id, label } feedback cast terakhir

  const { recordAnswer } = useItemProgress();
  const { consumeItem, loseXp, gainMedaru, progress } = useUserStats();
  const { triggerEffect, resetEffectStreak } = useEffectLayer();

  // Refs untuk hindari stale closure (pola useQuizSession).
  const queueRef = useRef({ queue: [], lastId: null });
  const isAnsweredRef = useRef(false);
  const livesRef = useRef(DEATH_START_LIVES);
  const scoreRef = useRef(0);
  const phaseRef = useRef('intro');
  const usedJumpersRef = useRef(0);
  const itemsRef = useRef({});
  const timersRef = useRef([]);
  const bestComboRef = useRef(0);      // combo tertinggi satu run (untuk bonus Medaru)
  const skillStateRef = useRef(deathInitialSkillState());

  // Mirror ownedItems ke ref — dibaca di callback timer (butuh nilai fresh).
  useEffect(() => {
    itemsRef.current = progress?.ownedItems || {};
  }, [progress]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const pushTimer = useCallback((fn, ms) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const setPhaseBoth = useCallback((p) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Setter skill state: sinkron ke ref (dibaca di callback timer) + state (UI).
  const applySkillState = useCallback((next) => {
    skillStateRef.current = next;
    if (next.combo > bestComboRef.current) bestComboRef.current = next.combo;
    setSkillState(next);
  }, []);

  // Soal berikutnya dari queue endless.
  const nextQuestion = useCallback(() => {
    const draw = drawNextDeathItem(queueRef.current, ALL_ITEMS);
    queueRef.current = { queue: draw.queue, lastId: draw.lastId };
    const options = buildOptions(draw.item, ALL_ITEMS, 4, DATASETS);
    isAnsweredRef.current = false;
    setCurrent({ target: draw.item, options });
    setAnsweredId(null);
    setIsAnswered(false);
    setLastResult(null);
    setEliminatedIds([]);   // opsi buangan 六眼 hanya berlaku per-soal
    setLastCast(null);
    setTimeLeft(DEATH_TIMER_S);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    resetEffectStreak();
    queueRef.current = { queue: [], lastId: null };
    livesRef.current = DEATH_START_LIVES;
    scoreRef.current = 0;
    usedJumpersRef.current = 0;
    bestComboRef.current = 0;
    setLives(DEATH_START_LIVES);
    setScore(0);
    setRunResult(null);
    setSkillState(deathInitialSkillState());
    setEliminatedIds([]);
    setLastCast(null);
    setPhaseBoth('playing');
    nextQuestion();
  }, [clearTimers, nextQuestion, resetEffectStreak, setPhaseBoth]);

  // Akhiri run: hitung penalti + hadiah medaru, panggil loseXp/gainMedaru SEKALI.
  // Kompensasi sepadan: mode ini paling berisiko, jadi run yang berakhir membayar
  // medaru (escalating). `finishRun` hanya dipanggil saat MATI atau MENYERAH —
  // keluar sukarela lewat `quit` tidak dibayar (anti-farm).
  const finishRun = useCallback(() => {
    clearTimers();
    const applied = loseXp(DEATH_XP_PENALTY);
    const medaru = deathMedaruReward(scoreRef.current) + deathComboBonus(bestComboRef.current);
    if (medaru > 0) gainMedaru(medaru);
    setRunResult({
      score: scoreRef.current,
      penaltyApplied: applied,
      usedJumpers: usedJumpersRef.current,
      medaruGained: medaru,
      bestCombo: bestComboRef.current,
    });
    setPhaseBoth('gameover');
  }, [clearTimers, loseXp, gainMedaru, setPhaseBoth]);

  // Soal terjawab (benar/salah/timeout) → kurangi nyawa bila perlu, lanjut.
  const resolveAnswer = useCallback((correct) => {
    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      applySkillState(deathSkillOnCorrect(skillStateRef.current));
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
      applySkillState(deathSkillOnWrong(skillStateRef.current));
    }

    pushTimer(() => {
      if (!correct && livesRef.current <= 0) {
        // MATI — cek kabel jumper untuk revive.
        const haveJumper = (itemsRef.current?.kabel_jumper || 0) > 0;
        if (haveJumper) {
          setPhaseBoth('revive');
        } else {
          finishRun();
        }
        return;
      }
      nextQuestion();
    }, correct ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS);
  }, [finishRun, nextQuestion, pushTimer, setPhaseBoth]);

  const selectAnswer = useCallback((optionId) => {
    if (isAnsweredRef.current || phaseRef.current !== 'playing') return;
    const q = current;
    if (!q) return;
    isAnsweredRef.current = true;

    const correct = optionId === q.target.id;
    setAnsweredId(optionId);
    setIsAnswered(true);
    setLastResult({ correct, itemId: q.target.id });
    setTimeLeft(null); // hentikan timer soal ini

    triggerEffect(correct ? 'correct' : 'wrong');
    recordAnswer(q.target.id, correct, DEATH_XP_PER_CORRECT);
    resolveAnswer(correct);
  }, [current, recordAnswer, resolveAnswer, triggerEffect]);

  // Timer soal: hitung mundur 7 dtk; 0 = dihitung salah.
  useEffect(() => {
    if (phase !== 'playing' || isAnswered || timeLeft === null) return;
    if (timeLeft <= 0) {
      // Waktu habis = salah (pola useQuizSession).
      if (!isAnsweredRef.current && current) {
        isAnsweredRef.current = true;
        setIsAnswered(true);
        setLastResult({ correct: false, itemId: current.target.id });
        triggerEffect('wrong');
        recordAnswer(current.target.id, false, DEATH_XP_PER_CORRECT);
        resolveAnswer(false);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s === null ? null : s - 1)), 1000);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [phase, isAnswered, timeLeft, current, recordAnswer, resolveAnswer, triggerEffect]);

  // Pakai kabel jumper: consume 1, nyawa jadi 1, lanjut run.
  const useJumper = useCallback(() => {
    const res = consumeItem('kabel_jumper');
    if (res !== 'used') return res;
    usedJumpersRef.current += 1;
    livesRef.current = 1;
    setLives(1);
    setPhaseBoth('playing');
    nextQuestion();
    return 'used';
  }, [consumeItem, nextQuestion, setPhaseBoth]);

  // Menyerah dari layar revive → run selesai (tetap kena penalti; mati tetap mati).
  const giveUp = useCallback(() => {
    finishRun();
  }, [finishRun]);

  // ── SKILL 呪術 ───────────────────────────────────────────────────────────
  // Cast 1 skill aktif (butuh ≥1 charge). Efek per `kind`:
  //   eliminate → buang 2 opsi salah di soal aktif (六眼)
  //   time      → tambah waktu soal aktif (無下限)
  //   life      → pulihkan 1 nyawa (反転術式)
  const useSkill = useCallback((skillId) => {
    const skill = deathSkillById(skillId);
    if (!skill) return 'unknown';
    if (phaseRef.current !== 'playing') return 'not-playing';
    if (isAnsweredRef.current) return 'already-answered';
    if (!deathSkillCanCast(skillStateRef.current, skillId)) return 'no-charge';

    if (skill.kind === 'eliminate') {
      // Butuh soal aktif + tahu jawaban benar → buang 2 opsi salah yang belum dibuang.
      const q = current;
      if (!q) return 'no-question';
      const wrongIds = q.options
        .map((o) => o.id)
        .filter((id) => id !== q.target.id && !eliminatedIds.includes(id));
      if (wrongIds.length === 0) return 'nothing-to-eliminate';
      // Acak ringan biar tidak selalu buang yang sama.
      const pick = wrongIds.slice(0, 2);
      applySkillState(deathSkillSpend(skillStateRef.current));
      setEliminatedIds((prev) => [...prev, ...pick]);
      setLastCast({ id: skillId, label: skill.name });
      return 'used';
    }

    if (skill.kind === 'time') {
      applySkillState(deathSkillSpend(skillStateRef.current));
      setTimeLeft((s) => (s === null ? null : s + DEATH_MUGEN_BONUS_S));
      setLastCast({ id: skillId, label: skill.name });
      return 'used';
    }

    if (skill.kind === 'life') {
      applySkillState(deathSkillSpend(skillStateRef.current));
      livesRef.current += 1;
      setLives(livesRef.current);
      setLastCast({ id: skillId, label: skill.name });
      return 'used';
    }

    return 'unknown';
  }, [current, eliminatedIds, applySkillState]);

  // Keluar sukarela (dari intro/gameover) — TANPA penalti.
  const quit = useCallback(() => {
    clearTimers();
    setPhaseBoth('intro');
    setCurrent(null);
    setRunResult(null);
  }, [clearTimers, setPhaseBoth]);

  return {
    phase,
    current,
    options: current ? current.options : [],
    lives,
    score,
    timeLeft,
    answeredId,
    isAnswered,
    lastResult,
    runResult,
    skillState,
    eliminatedIds,
    lastCast,
    start,
    selectAnswer,
    useJumper,
    useSkill,
    giveUp,
    quit,
  };
}
