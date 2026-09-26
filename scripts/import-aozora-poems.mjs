// Importer puisi bertema dari Aozora Bunko (青空文庫) — public domain.
//
// Kenapa script ini ada: teks puisi TIDAK diketik ulang dari ingatan. Script
// mengambil HTML resmi Aozora (Shift_JIS), mem-parse tag <ruby> untuk furigana,
// dan mengisi bacaan kanji yang TIDAK punya ruby dari peta kurasi
// scripts/aozora-readings.json (bacaan diverifikasi silang dengan file ruby
// resmi Aozora + kurasi manual). Kalau ada run kanji yang belum ada di peta →
// script THROW dengan daftar lengkap (tidak ada tebakan diam-diam).
//
// Pakai:
//   node scripts/import-aozora-poems.mjs --dump-lines --cache ~/aozora_research > dump.json
//   node scripts/import-aozora-poems.mjs --check --cache ~/aozora_research   # validasi + daftar bacaan kurang
//   node scripts/import-aozora-poems.mjs --cache ~/aozora_research          # fetch + tulis src/data/poems.json
//
// Sumber (diakses 26/09/2026):
//   若菜集 島崎藤村       cards/000158/files/1508_18509.html
//   山羊の歌 中原中也     cards/000026/files/894_28272.html
//   智恵子抄 高村光太郎   cards/001168/files/46669_25695.html
//   〔雨ニモマケズ〕宮澤賢治 cards/000081/files/45630_23908.html
//   道程 高村光太郎       cards/001168/files/59185_75168.html
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';
import { homedir } from 'node:os';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const CACHE_DIR = opt('--cache', join(homedir(), 'aozora_research'));
const CHECK_ONLY = flag('--check');
const DUMP = flag('--dump-lines');

const SOURCES = {
  wakana: 'https://www.aozora.gr.jp/cards/000158/files/1508_18509.html',
  yagino: 'https://www.aozora.gr.jp/cards/000026/files/894_28272.html',
  chieshiko: 'https://www.aozora.gr.jp/cards/001168/files/46669_25695.html',
  ameni: 'https://www.aozora.gr.jp/cards/000081/files/45630_23908.html',
  doutei: 'https://www.aozora.gr.jp/cards/001168/files/59185_75168.html',
};

// ── Peta bacaan kanji TANPA ruby ────────────────────────────────────────────
// File kurasi: scripts/aozora-readings.json — { global: {run: bacaan},
// perPoem: {key: {run: bacaan}} }. Bacaan per puisi menang atas global.
// Diisi dari kurasi manual + verifikasi silang file ruby resmi Aozora; script
// akan THROW kalau ada run yang belum terpetakan.
const READINGS_PATH = join(SCRIPT_DIR, 'aozora-readings.json');
const READINGS = existsSync(READINGS_PATH)
  ? JSON.parse(readFileSync(READINGS_PATH, 'utf8'))
  : { global: {}, perPoem: {} };

// Gaiji (karakter di luar JIS yang tampil sebagai <img>) — key = potongan alt.
// 雨ニモマケズ「野原ノ松ノ林ノ蔭」の異体字（蔭のつくりを差し替えた字）→ 蔭/かげ。
const GAIJI_SUB = { '蔭': { t: '蔭', r: 'かげ' } };

// Run yang harus dipecah — bacaan gabungan tidak berlaku di konteks ini.
// 樹下の二人「二人静かに」= ふたり + しずか + に。
const SPLIT_RUNS = { '二人静': ['二人', '静'] };

// Run yang okurigana di belakangnya sudah termasuk bacaan (hindari dobel).
// 「爲め」= ため (bukan ため+め)、「輝やく」= かがやく (bukan かがや+やく)。
const ABSORB_RUNS = new Set(['爲', '輝']);

// ── Metadata puisi (judul, penulis, tema, arti) ─────────────────────────────
const POEM_META = [
  { key: 'hatsukoi', source: 'wakana', id: 'poem_shimazaki_hatsukoi', title: '初恋', titleReading: 'はつこい', author: '島崎藤村', authorReading: 'しまざきとうそん', theme: 'love', type: 'free', excerpt: false,
    meaning: "First love — the shy awakening of a boy's heart under the apple trees.", meaning_id: 'Cinta pertama — bangkitnya hati pemuda di bawah pohon apel.' },
  { key: 'kamiwo', source: 'wakana', id: 'poem_shimazaki_kamiwoaraeba', title: '髪を洗へば', titleReading: 'かみをあらへば', author: '島崎藤村', authorReading: 'しまざきとうそん', theme: 'joy', type: 'free', excerpt: false,
    meaning: 'Washing her hair, the poet feels the whole world turn into a scroll of love.', meaning_id: 'Saat mencuci rambut, dunia terasa berubah jadi gulungan lukisan cinta.' },
  { key: 'haruhakinu', source: 'wakana', id: 'poem_shimazaki_haruhakinu', title: '春はきぬ', titleReading: 'はるはきぬ', author: '島崎藤村', authorReading: 'しまざきとうそん', theme: 'joy', type: 'free', excerpt: false,
    meaning: 'Spring has come — winter is sent away and the fields are called to bloom.', meaning_id: 'Musim semi tiba — musim dingin dipulangkan dan ladang dipanggil bersemi.' },
  { key: 'yogore', source: 'yagino', id: 'poem_nakahara_yogore', title: '汚れつちまつた悲しみに……', titleReading: 'よごれつちまつたかなしみに', author: '中原中也', authorReading: 'なかはらちゅうや', theme: 'sadness', type: 'free', excerpt: false,
    meaning: 'A sorrow worn dirty by days of snow and wind, dreaming of death in weariness.', meaning_id: 'Kesedihan yang kotor termakan hari — bermimpi mati dalam kejenuhan.' },
  { key: 'rinju', source: 'yagino', id: 'poem_nakahara_rinju', title: '臨終', titleReading: 'りんじゅう', author: '中原中也', authorReading: 'なかはらちゅうや', theme: 'sadness', type: 'free', excerpt: false,
    meaning: 'At a deathbed — autumn sky, white wind, and a soul quietly fading.', meaning_id: 'Di saat ajal — langit musim gugur, angin putih, dan jiwa yang perlahan sirna.' },
  { key: 'harunohi', source: 'yagino', id: 'poem_nakahara_harunohinoyugure', title: '春の日の夕暮', titleReading: 'はるのひのゆうぐれ', author: '中原中也', authorReading: 'なかはらちゅうや', theme: 'joy', type: 'free', excerpt: false,
    meaning: 'A spring evening — strange, calm, and quietly moving forward.', meaning_id: 'Senja musim semi — aneh, tenang, dan perlahan bergerak maju.' },
  { key: 'kofuku', source: 'yagino', id: 'poem_nakahara_kofuku', title: '幸福', titleReading: 'こうふく', author: '中原中也', authorReading: 'なかはらちゅうや', theme: 'gratitude', type: 'free', excerpt: false,
    meaning: 'Happiness lives in the stable, on the straw — an open heart finds it at once.', meaning_id: 'Kebahagiaan ada di kandang, di atas jerami — hati yang lapang menemukannya seketika.' },
  { key: 'juka', source: 'chieshiko', id: 'poem_takamura_jukanofutari', title: '樹下の二人', titleReading: 'じゅかのふたり', author: '高村光太郎', authorReading: 'たかむらこうたろう', theme: 'love', type: 'free', excerpt: false,
    meaning: 'Under the pines of Adatara, the poet and Chieko quietly burn together.', meaning_id: 'Di bawah pinus Adatara — penyair dan Chieko membara dalam diam.' },
  { key: 'dandan', source: 'chieshiko', id: 'poem_takamura_dandan', title: 'あなたはだんだんきれいになる', titleReading: 'あなたはだんだんきれいになる', author: '高村光太郎', authorReading: 'たかむらこうたろう', theme: 'love', type: 'free', excerpt: false,
    meaning: 'You grow more beautiful — a woman shedding every ornament becomes pure.', meaning_id: 'Kau makin cantik — perempuan yang melepas segala perhiasan menjadi murni.' },
  { key: 'lemon', source: 'chieshiko', id: 'poem_takamura_lemonaika', title: 'レモン哀歌', titleReading: 'れもんあいか', author: '高村光太郎', authorReading: 'たかむらこうたろう', theme: 'sadness', type: 'free', excerpt: false,
    meaning: "Chieko's last days — the scent of a lemon and a final moment of clarity.", meaning_id: 'Hari-hari terakhir Chieko — aroma lemon dan kejernihan di saat akhir.' },
  { key: 'ameni', source: 'ameni', id: 'poem_kenji_amenimomakezu', title: '雨ニモマケズ', titleReading: 'あめにもまけず', author: '宮沢賢治', authorReading: 'みやざわけんじ', theme: 'gratitude', type: 'free', excerpt: false,
    meaning: 'Unbeaten by rain or wind — the wish to live simply and serve others.', meaning_id: 'Tak kalah oleh hujan dan angin — keinginan hidup sederhana dan melayani sesama.' },
  { key: 'doutei', source: 'doutei', id: 'poem_takamura_doutei', title: '道程', titleReading: 'どうてい', author: '高村光太郎', authorReading: 'たかむらこうたろう', theme: 'gratitude', type: 'free', excerpt: true,
    meaning: 'The road ahead — no path before me; a path is made behind me as I walk.', meaning_id: 'Jalan hidup — tak ada jalan di depan; jalan tercipta di belakang saat aku melangkah.' },
];

// ── Fetch / cache ───────────────────────────────────────────────────────────
function fetchText(url) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (japanese-quiz importer)' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} ${url}`)); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(new TextDecoder('shift_jis').decode(Buffer.concat(chunks))));
    }).on('error', reject);
  });
}

async function loadSource(name, url) {
  const cached = join(CACHE_DIR, `${name}.html`);
  if (existsSync(cached)) return new TextDecoder('shift_jis').decode(readFileSync(cached));
  return fetchText(url);
}

// ── Parsing Aozora ──────────────────────────────────────────────────────────
const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf\u3005]+/g;

function mainText(html) {
  const start = html.indexOf('<div class="main_text">');
  if (start < 0) throw new Error('main_text tidak ditemukan');
  const endMark = ['<div class="bibliographical_information">', '<div class="notation_notes">']
    .map((m) => html.indexOf(m, start)).filter((i) => i > 0).sort((a, b) => a - b)[0] ?? html.length;
  let body = html.slice(start, endMark);
  body = body.slice(0, body.lastIndexOf('</div>'));
  return body;
}

function parseTokens(body) {
  body = body.replace(/<span class="notes">[\s\S]*?<\/span>/g, '');
  const toks = [];
  const pat = /<ruby>([\s\S]*?)<\/ruby>|<br\s*\/?>|<img[^>]*?alt="([^"]*)"[^>]*?\/?>/g;
  let pos = 0;
  let m;
  const pushText = (chunk) => {
    const t = chunk.replace(/<[^>]+>/g, '');
    if (t.trim()) toks.push({ k: 'text', t: unescapeHtml(t) });
  };
  while ((m = pat.exec(body)) !== null) {
    if (m.index > pos) pushText(body.slice(pos, m.index));
    if (m[1] !== undefined) {
      const inner = m[1];
      const rb = /<rb>([\s\S]*?)<\/rb>/.exec(inner);
      const rt = /<rt>([\s\S]*?)<\/rt>/.exec(inner);
      const base = rb ? unescapeHtml(rb[1].replace(/<[^>]+>/g, '')) : '';
      const read = rt ? unescapeHtml(rt[1].replace(/<[^>]+>/g, '')) : '';
      toks.push({ k: 'ruby', t: base, r: read });
    } else if (m[2] !== undefined) {
      toks.push({ k: 'gaiji', alt: m[2] });
    } else {
      toks.push({ k: 'br' });
    }
    pos = pat.lastIndex;
  }
  if (pos < body.length) pushText(body.slice(pos));
  return toks;
}

const unescapeHtml = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');

function toLines(toks) {
  const lines = [[]];
  for (const t of toks) {
    if (t.k === 'br') lines.push([]);
    else lines[lines.length - 1].push(t);
  }
  // Gaiji dibiarkan apa adanya di sini; resolusi (dan THROW kalau belum
  // dipetakan) hanya untuk baris yang benar-benar dipakai — di segmentsOf.
  return lines.filter((ln) => ln.some((t) => (t.t || t.alt || '').trim()));
}

const linePlain = (ln) => ln.map((t) => t.t || '').join('').replace(/[\u3000\s]/g, '');

const missing = [];
const missingGaiji = [];
function segmentsOf(ln, ctx, idx) {
  const segs = [];
  for (const t of ln) {
    if (t.k === 'gaiji') {
      const key = Object.keys(GAIJI_SUB).find((k) => (t.alt || '').includes(k));
      if (!key) {
        missingGaiji.push(`${ctx}: ${t.alt}`);
        segs.push({ t: '※', s: 'gaiji' });
        continue;
      }
      const sub = GAIJI_SUB[key];
      segs.push(sub.r ? { t: sub.t, r: sub.r, s: 'gaiji' } : { t: sub.t, s: 'gaiji' });
      continue;
    }
    if (t.k === 'ruby') {
      const rt = t.t.replace(/[\r\n]+/g, '');
      if (!rt) continue;
      segs.push(t.r ? { t: rt, r: t.r, s: 'html' } : { t: rt, s: 'html' });
      continue;
    }
    if (t.k !== 'text') continue;
    const tt = t.t.replace(/[\r\n]+/g, '');
    if (!tt) continue;
    let last = 0;
    KANJI.lastIndex = 0;
    let m;
    const read = (key) =>
      (READINGS.perLine?.[ctx]?.[idx] || {})[key] ??
      (READINGS.perPoem[ctx] || {})[key] ??
      READINGS.global[key];
    while ((m = KANJI.exec(tt)) !== null) {
      if (m.index > last) segs.push({ t: tt.slice(last, m.index) });
      const run = m[0];
      const split = SPLIT_RUNS[run];
      if (split) {
        for (const part of split) {
          const rp = read(part);
          if (!rp) { missing.push(`${ctx}: ${part}`); segs.push({ t: part, s: 'map' }); }
          else segs.push({ t: part, r: rp, s: 'map' });
        }
        last = m.index + run.length;
        continue;
      }
      const r = read(run);
      if (!r) {
        missing.push(`${ctx}: ${run}`);
        segs.push({ t: run, s: 'map' });
        last = m.index + run.length;
        continue;
      }
      const rest = tt.slice(m.index + run.length);
      const absorbed = ABSORB_RUNS.has(run) && rest && r.endsWith(rest[0]) ? 1 : 0;
      segs.push(absorbed ? { t: run + rest[0], r, s: 'map' } : { t: run, r, s: 'map' });
      last = m.index + run.length + absorbed;
    }
    if (last < tt.length) segs.push({ t: tt.slice(last) });
  }
  return segs;
}

// ── Slicing per karya ───────────────────────────────────────────────────────
function sliceByMarkers(lines, startTest, endTest, expect, ctx) {
  const s = lines.findIndex(startTest);
  if (s < 0) throw new Error(`${ctx}: penanda awal tidak ketemu`);
  const e = lines.findIndex((ln, i) => i > s && endTest(ln));
  if (e < 0) throw new Error(`${ctx}: penanda akhir tidak ketemu`);
  const out = lines.slice(s + 1, e);
  if (out.length !== expect) throw new Error(`${ctx}: ${out.length} baris, harusnya ${expect}`);
  return out;
}

function headingChunks(body) {
  const pat = /<h([345])[^>]*>([\s\S]*?)<\/h\1>/g;
  const marks = [];
  let m;
  while ((m = pat.exec(body)) !== null) {
    marks.push({ start: m.index, end: pat.lastIndex, title: unescapeHtml(m[2].replace(/<[^>]+>/g, '')).trim() });
  }
  return marks.map((mk, i) => ({
    title: mk.title,
    chunk: body.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : body.length),
  }));
}

const dropDate = (ln) => !/^(明治|大正|昭和|平成)/.test(linePlain(ln));

// ── Build ───────────────────────────────────────────────────────────────────
async function build() {
  const html = {};
  for (const [name, url] of Object.entries(SOURCES)) html[name] = await loadSource(name, url);

  const wakana = toLines(parseTokens(mainText(html.wakana)));
  const ameni = toLines(parseTokens(mainText(html.ameni)));
  const doutei = toLines(parseTokens(mainText(html.doutei)));
  const yaginoBody = mainText(html.yagino);
  const chieBody = mainText(html.chieshiko);
  const chunkOf = (body, title) => {
    const hit = headingChunks(body).filter((c) => c.title === title);
    if (hit.length !== 1) throw new Error(`heading "${title}" ditemukan ${hit.length}x (harus 1)`);
    return toLines(parseTokens(hit[0].chunk)).filter(dropDate);
  };

  const picked = {
    hatsukoi: sliceByMarkers(
      wakana,
      (ln) => linePlain(ln) === '初恋',
      (ln) => linePlain(ln) === '狐のわざ',
      16, '初恋',
    ),
    kamiwo: sliceByMarkers(
      wakana,
      (ln) => linePlain(ln) === '髪を洗へば',
      (ln) => linePlain(ln) === '君がこゝろは',
      16, '髪を洗へば',
    ),
    haruhakinu: (() => {
      const anchor = wakana.findIndex((ln) => linePlain(ln).includes('春は来ぬ') && linePlain(ln).includes('三'));
      const s = wakana.findIndex((ln, i) => i > anchor && linePlain(ln) === '春はきぬ');
      const e = wakana.findIndex((ln, i) => i > s && linePlain(ln).includes('眠れる春よ'));
      const out = wakana.slice(s, e);
      if (out.length !== 36) throw new Error(`春はきぬ: ${out.length} baris, harusnya 36`);
      return out;
    })(),
    yogore: chunkOf(yaginoBody, '汚れつちまつた悲しみに……'),
    rinju: chunkOf(yaginoBody, '臨終'),
    harunohi: chunkOf(yaginoBody, '春の日の夕暮'),
    kofuku: chunkOf(yaginoBody, '幸福'),
    juka: chunkOf(chieBody, '樹下の二人'),
    dandan: chunkOf(chieBody, 'あなたはだんだんきれいになる'),
    lemon: chunkOf(chieBody, 'レモン哀歌'),
    ameni: (() => {
      const e = ameni.findIndex((ln) => linePlain(ln) === '南無無辺行菩薩');
      const out = ameni.slice(0, e);
      if (out.length !== 30) throw new Error(`雨ニモマケズ: ${out.length} baris, harusnya 30`);
      return out;
    })(),
    doutei: (() => {
      const out = doutei.slice(-14);
      if (linePlain(out[0]) !== 'ああ') throw new Error(`道程: baris pertama kutipan "${linePlain(out[0])}"`);
      return out;
    })(),
  };

  // Jumlah baris yang diharapkan (kontrak test). Diverifikasi dari dump.
  const EXPECT = { hatsukoi: 16, kamiwo: 16, haruhakinu: 36, yogore: 16, rinju: 16, harunohi: 16, kofuku: 20, juka: 35, dandan: 13, lemon: 18, ameni: 30, doutei: 14 };
  if (!DUMP) {
    for (const [key, n] of Object.entries(EXPECT)) {
      if (picked[key].length !== n) throw new Error(`${key}: ${picked[key].length} baris, harusnya ${n}`);
    }
  }

  const built = POEM_META.map((meta) => ({
    id: meta.id,
    title: meta.title,
    titleReading: meta.titleReading,
    author: meta.author,
    authorReading: meta.authorReading,
    type: meta.type,
    excerpt: meta.excerpt,
    theme: meta.theme,
    source: SOURCES[meta.source],
    meaning: meta.meaning,
    meaning_id: meta.meaning_id,
    lines: picked[meta.key].map((ln, i) => ({
      segments: segmentsOf(ln, meta.key, i).map((sg) => (sg.r ? { t: sg.t, r: sg.r } : { t: sg.t })),
    })),
  }));

  return { built, picked };
}

// ── Main ────────────────────────────────────────────────────────────────────
const { built, picked } = await build();

if (DUMP) {
  const dump = {};
  for (const meta of POEM_META) {
    dump[meta.key] = picked[meta.key].map((ln, i) => ({
      i,
      plain: linePlain(ln),
      segments: segmentsOf(ln, meta.key, i),
    }));
  }
  process.stdout.write(JSON.stringify(dump, null, 1) + '\n');
  process.exit(0);
}

if (missing.length || missingGaiji.length) {
  if (missingGaiji.length) {
    console.error(`THROW: ${missingGaiji.length} gaiji belum dipetakan:`);
    for (const s of [...new Set(missingGaiji)]) console.error('  ', s);
  }
  if (missing.length) {
    const uniq = [...new Set(missing.map((s) => s.split(': ')[1]))].sort();
    console.error(`THROW: ${missing.length} run kanji belum punya bacaan (${uniq.length} unik):`);
    console.error(uniq.join(' '));
    console.error('\nContoh konteks:');
    for (const s of missing.slice(0, 40)) console.error('  ', s);
  }
  process.exit(2);
}

if (CHECK_ONLY) {
  console.log('OK: semua run kanji punya bacaan. Baris per puisi:');
  for (const p of built) console.log(`  ${p.id}: ${p.lines.length}`);
  process.exit(0);
}

// Merge: 7 klasik dipertahankan apa adanya; 雨ニモマケズ diganti versi lengkap;
// 11 puisi bertema baru di-append (total 19).
const path = join(ROOT, 'src', 'data', 'poems.json');
const old = JSON.parse(readFileSync(path, 'utf8'));
const keep = old.filter((p) => p.id !== 'poem_kenji_amenimomakezu');
const ameniNew = built.find((p) => p.id === 'poem_kenji_amenimomakezu');
const others = built.filter((p) => p.id !== 'poem_kenji_amenimomakezu');
const merged = [];
for (const p of keep) {
  merged.push(p);
  if (p.id === 'poem_komachi_hananoiro') merged.push(ameniNew); // posisi lama ameni
}
merged.push(...others);
if (merged.length !== 19) throw new Error(`merged ${merged.length} puisi, harusnya 19`);

writeFileSync(path, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log(`OK: ${merged.length} puisi ditulis ke src/data/poems.json (${others.length + 1} baru/di-update)`);
