#!/usr/bin/env node
// scripts/prd-inventory.mjs — cetak angka inventaris fitur yang HARUS cocok dengan PRD.md.
// Pakai: node scripts/prd-inventory.mjs
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const json = (p) => JSON.parse(read(p));
const count = (p) => json(p).length;
const countRe = (p, re) => (read(p).match(re) || []).length;

// n5-exam.json = objek { tipeMondai: [soal, ...] }; jumlah soal = total semua array.
const n5 = json('src/data/n5-exam.json');
const n5Types = Object.keys(n5).length;
const n5Items = Object.values(n5).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);

const rows = [
  ['hiragana', count('src/data/hiragana.json')],
  ['katakana', count('src/data/katakana.json')],
  ['kotoba', count('src/data/kotoba.json')],
  ['kanji', count('src/data/kanji.json')],
  ['grammar', count('src/data/grammar.json')],
  ['mondai', count('src/data/mondai.json')],
  ['n5-exam types', n5Types],
  ['n5-exam authored items', n5Items],
  ['poems', count('src/data/poems.json')],
  ['syllabus chapters', count('src/data/syllabus.json')],
  ['badges (ACHIEVEMENT_META)', countRe('src/features/progress/ProgressContext.jsx', /^  [a-z0-9_]+: \{ label:/gm)],
  ['tutorial topics', countRe('src/features/tutorial/tutorials.js', /^    title: '/gm)],
  ['routes', countRe('src/App.jsx', /<Route path="/g)],
];

for (const [k, v] of rows) console.log(`${k}: ${v}`);
