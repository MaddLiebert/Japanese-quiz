// Loader data goresan dari public/strokes — murni, dites `node --test`.
// fetch di-inject (default: globalThis.fetch) supaya bisa dites tanpa DOM,
// mengikuti pola `primeVoice(voice, fetcher)` di src/utils/sfx.js.
import { strokeDataPath } from './writing.js';

// Ambil data goresan 1 karakter. Return Promise<CharacterJson>.
export const loadStrokeData = (char, fetcher = globalThis.fetch) => {
  const path = strokeDataPath(char);
  if (!path) return Promise.reject(new Error(`no stroke data for ${char}`));
  return Promise.resolve(fetcher(path)).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status} for ${path}`)),
  );
};

// Kontrak charDataLoader hanzi-writer: (char, onLoad, onError) → Promise|void.
export const localCharDataLoader = (char, onLoad, onError, fetcher = globalThis.fetch) => {
  return loadStrokeData(char, fetcher).then(onLoad).catch(onError);
};
