// speechLog.js — penyimpan log event ASR lintas-halaman (halaman Speaking ↔ sesi
// SpeakSession/PoemSession). Sesi mic terjadi DI DALAM SpeakSession, sedangkan
// panel diagnosa ada di halaman Speaking — jadi log harus lewat store bersama
// (memori + localStorage), bukan state komponen.
// Aman di `node --test`: semua akses localStorage dijaga (kalau tak ada → memori).
const KEY = 'nihongo.speechLog.v1';
const MAX = 300;

let mem = [];
let loaded = false;
const subs = new Set();

const storage = () => (typeof localStorage === 'undefined' ? null : localStorage);

const load = () => {
  if (loaded) return;
  loaded = true;
  const s = storage();
  if (!s) return;
  try {
    const raw = s.getItem(KEY);
    if (raw) mem = JSON.parse(raw) || [];
  } catch { mem = []; }
};

const persist = () => {
  const s = storage();
  if (!s) return;
  try { s.setItem(KEY, JSON.stringify(mem)); } catch { /* penuh / diblokir */ }
};

const notify = () => subs.forEach((fn) => { try { fn(mem); } catch { /* noop */ } });

// Tambah satu event (timestamp otomatis). Dipanggil dari onEvent SpeechRecognition.
export const appendSpeechEvent = (ev) => {
  load();
  mem = [...mem, { t: Date.now(), ...ev }].slice(-MAX);
  persist();
  notify();
  return mem;
};

export const readSpeechEvents = () => { load(); return mem; };

export const clearSpeechEvents = () => {
  load();
  mem = [];
  persist();
  notify();
};

export const subscribeSpeechLog = (fn) => {
  load();
  subs.add(fn);
  return () => subs.delete(fn);
};

// Hanya untuk tes: reset state modul.
export const __resetSpeechLog = () => { mem = []; loaded = false; subs.clear(); };
