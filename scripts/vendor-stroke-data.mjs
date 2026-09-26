// Vendor data goresan untuk fitur Writing.
// Sumber: package npm `kanji-writer-data-jp` (Arphic Public License + LGPL animCJK).
// Output: public/strokes/<codepoint-hex>.json  (5 digit hex, mis. 03042 = あ)
// Jalankan ulang kapan pun dataset berubah:  node scripts/vendor-stroke-data.mjs
import { readFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'node_modules', 'kanji-writer-data-jp');
const OUT_DIR = join(ROOT, 'public', 'strokes');

const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const hiragana = readJSON('src/data/hiragana.json');
const katakana = readJSON('src/data/katakana.json');
const kanji = readJSON('src/data/kanji.json');

// Semua code point yang perlu data goresan (kana single, semua katakana, semua kanji,
// plus code point dasar dari item yoon seperti き や ゃ).
const needed = new Set();
for (const item of [...hiragana, ...katakana]) {
  for (const ch of item.char.normalize('NFC')) needed.add(ch);
}
for (const item of kanji) needed.add(item.char.normalize('NFC'));

const hexOf = (ch) => ch.codePointAt(0).toString(16).padStart(5, '0');

mkdirSync(OUT_DIR, { recursive: true });
const missing = [];
let copied = 0;
for (const ch of needed) {
  const src = join(SRC_DIR, `${ch}.json`);
  const out = join(OUT_DIR, `${hexOf(ch)}.json`);
  if (!existsSync(src)) { missing.push(ch); continue; }
  copyFileSync(src, out);
  copied += 1;
}

// File lisensi wajib ikut (Arphic + LGPL) — syarat redistribusi.
for (const name of ['ARPHICPL.TXT', 'LGPL.txt']) {
  const src = join(SRC_DIR, 'licenses', name);
  if (existsSync(src)) copyFileSync(src, join(OUT_DIR, name));
}

console.log(`[vendor-stroke-data] copied ${copied} files → public/strokes/`);
console.log(`[vendor-stroke-data] needed ${needed.size}, missing ${missing.length}${missing.length ? ': ' + missing.join('') : ''}`);
if (missing.length > 0) process.exit(1);
