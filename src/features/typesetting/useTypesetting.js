import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  buildPool, correctOrder, checkOrder, misprintAmount, isComplete,
  pickQuestions, typesettingXp, DEFAULT_TYPESETTING_LEVEL,
} from './typesetting.js';

// Hook sesi 活字組み — mengelola: kolam blok, urutan terpasang, cek, maju soal.
// Logika murni tetap di typesetting.js (dites `node --test`); hook hanya state.
//
// Alur: susun blok → saat semua blok BENAR terpasang urut (isComplete) → auto-cek
// → benar: XP + lanjut; salah: misprint muncul, pemain merapikan.
//
// Catatan: side-effect (setChecked/onCorrect) sengaja dijalankan DI LUAR updater
// setState (pakai ref `placedRef`) supaya tidak dobel saat React StrictMode
// memanggil updater dua kali.
export function useTypesetting({ bank = [], level = DEFAULT_TYPESETTING_LEVEL, onCorrect } = {}) {
  const questions = useMemo(() => pickQuestions(bank, level), [bank, level]);
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState([]);       // id blok yang terpasang (urut)
  const [checked, setChecked] = useState(null);   // { ok, misprintAt } | null
  const [done, setDone] = useState(false);
  const [seed, setSeed] = useState(1);
  const [solved, setSolved] = useState(0);
  const placedRef = useRef([]);                   // cermin `placed` (baca sinkron)
  const solvedRef = useRef(false);                // soal ini sudah dihitung?

  const question = questions[index] || null;
  const pool = useMemo(() => (question ? buildPool(question, seed) : []), [question, seed]);
  const remaining = useMemo(
    () => pool.filter((b) => !placed.includes(b.id)),
    [pool, placed],
  );
  const misprint = question ? misprintAmount(question, placed) : 0;

  const reset = useCallback(() => {
    placedRef.current = [];
    solvedRef.current = false;
    setPlaced([]);
    setChecked(null);
  }, []);

  // Pasang blok ke urutan (dari kolam). Auto-cek saat sudah penuh.
  const place = useCallback((blockId) => {
    if (!question || solvedRef.current) return;
    const cur = placedRef.current;
    if (cur.includes(blockId)) return;
    const next = [...cur, blockId];
    placedRef.current = next;
    setPlaced(next);
    if (!isComplete(question, next)) return;

    const res = checkOrder(question, next);
    setChecked(res);
    if (res.ok) {
      solvedRef.current = true;
      setSolved((n) => n + 1);
      onCorrect?.(typesettingXp(level), question);
    }
  }, [question, level, onCorrect]);

  // Lepas blok dari urutan (balik ke kolam).
  const remove = useCallback((blockId) => {
    if (solvedRef.current) return;
    const next = placedRef.current.filter((id) => id !== blockId);
    placedRef.current = next;
    setPlaced(next);
    setChecked(null);
  }, []);

  // Bersihkan urutan (kecuali sudah benar).
  const clear = useCallback(() => { if (!solvedRef.current) reset(); }, [reset]);

  const next = useCallback(() => {
    if (index + 1 >= questions.length) { setDone(true); return; }
    setIndex((i) => i + 1);
    setSeed((s) => s + 1);
    reset();
  }, [index, questions.length, reset]);

  // Sinkronkan cermin kalau `placed` diubah dari luar (defensif).
  useEffect(() => { placedRef.current = placed; }, [placed]);

  return {
    question, pool, remaining, placed, checked, done,
    misprint,
    solved,
    total: questions.length,
    index,
    isSolved: Boolean(checked?.ok),
    place, remove, clear, next, reset,
    correctIds: question ? correctOrder(question) : [],
  };
}

export default useTypesetting;
