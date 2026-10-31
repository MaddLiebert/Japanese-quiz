// gen-kotoba-kanji.cjs — hasilkan src/data/kotobaKanji.json
//
// Tujuan: mode SULIT kuis Kotoba menampilkan kata dalam KANJI dan jawabannya
// HIRAGANA (bacaan). Dataset kotoba.json hanya menyimpan bentuk kana, jadi kita
// perlu peta id → bentuk kanji + bacaan.
//
// Sumber: JMdict (jmdict-simplified, CC BY-SA 4.0) di .hermes/_jmdict.json.
// Kandidat dicocokkan lewat: (1) bacaan kana sama, (2) arti Inggris item
// dibandingkan dengan gloss JMdict supaya homofon tidak salah pilih
// (はし "chopsticks" → 箸 bukan 橋; かみ "hair" → 髪 bukan 紙/神;
// とる "to take" → 取る bukan 撮る).
//
// Pakai:  node scripts/gen-kotoba-kanji.cjs
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const JM = JSON.parse(fs.readFileSync(path.join(root, '.hermes', '_jmdict.json'), 'utf8'));
const kotoba = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'kotoba.json'), 'utf8'));

const toHira = (s) => [...String(s)].map((ch) => {
  const c = ch.codePointAt(0);
  if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
  return ch;
}).join('');

const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const KANA_ONLY = /^[\u3041-\u309f\u30a1-\u30f6\u309d\u309e\u30fd\u30feー]+$/;

// JMdict menulis tanggal/jam dengan angka (９月, ２０日). Untuk latihan kanji,
// ubah ke angka kanji (九月, 二十日) — bentuk ini yang dipakai teks Jepang asli.
const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const numberToKanji = (n) => {
  if (n === 0) return '〇';
  if (n < 10) return DIGITS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return (tens === 1 ? '' : DIGITS[tens]) + '十' + (ones ? DIGITS[ones] : '');
  }
  return String(n); // di luar jangkauan dataset (tidak dipakai)
};
const toKanjiNumerals = (s) => String(s).replace(/[0-9０-９]+/g, (digits) => {
  const ascii = [...digits].map((ch) => (ch >= '０' && ch <= '９' ? String.fromCharCode(ch.charCodeAt(0) - 0xfee0) : ch)).join('');
  return numberToKanji(Number(ascii));
});

// ── Indeks bacaan → entri JMdict ────────────────────────────────────────────
// forms[0] = bentuk kanji utama (JMdict mengurutkan dari yang paling umum).
const byReading = new Map();
for (const w of JM.words) {
  // HANYA bentuk yang ditandai `common` di JMdict: bentuk langka/ateji
  // (此の, 彼の, 珈琲, 莫斯科) tidak layak diajarkan sebagai kanji.
  const forms = [...new Set((w.kanji || []).filter((k) => k.common).map((k) => k.text).filter((t) => KANJI.test(t)))];
  if (!forms.length) continue;
  const readings = [...new Set((w.kana || []).map((k) => toHira(k.text)).filter((r) => KANA_ONLY.test(r)))];
  if (!readings.length) continue;
  const senses = (w.sense || []).map((s) => (s.gloss || [])
    .filter((g) => g.lang === 'eng')
    .map((g) => g.text.toLowerCase().trim()));
  const entry = { form: forms[0], forms, senses };
  for (const r of readings) {
    if (!byReading.has(r)) byReading.set(r, []);
    byReading.get(r).push(entry);
  }
}

// ── Normalisasi arti ────────────────────────────────────────────────────────
// "To see / watch" → ['to see', 'watch']; tanda kurung DIPERTAHANKAN supaya
// "to take" (取る) tidak dianggap sama dengan "to take (a photograph)" (撮る).
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const variants = (s) => norm(s).split(/\s*\/\s*/).filter(Boolean);
const STOP = new Set(['to', 'a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'and', 'or', 'is', 'be', 'with', 'by', 'up', 'out', 'something', 'someone']);
const tokens = (s) => norm(s).replace(/[^a-z ]+/g, ' ').split(' ').filter((w) => w.length > 1 && !STOP.has(w));

// "photograph" ≈ "photo", "safe" ≈ "safety": dataset memakai bentuk pendek,
// JMdict memakai bentuk kamus. Cocokkan lewat batang kata + awalan.
const stem = (w) => w.replace(/(ing|ed|es|s|ness|ty|ity|ment|ance|ence)$/, '').slice(0, 5);
const tokenHit = (a, b) => a === b
  || (a.length >= 4 && b.length >= 4 && stem(a) === stem(b))
  || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));

function glossScore(vars, gloss) {
  const g = norm(gloss);
  let best = 0;
  for (const v of vars) {
    if (g === v) { best = Math.max(best, 12); continue; }
    // Awalan saja = bukti lemah: "to take" juga awalan dari "to take a photo".
    if (g.startsWith(v + ' ') || v.startsWith(g + ' ')) { best = Math.max(best, 5); continue; }
    const gt = tokens(g);
    const vt = tokens(v);
    if (!vt.length) continue;
    const hit = vt.filter((w) => gt.some((x) => tokenHit(w, x))).length;
    if (!hit) continue;
    const all = hit === vt.length;
    best = Math.max(best, hit * 2 + (all ? 3 : 0));
  }
  return best;
}

// Skor entri: tiap varian arti diambil gloss terbaiknya, lalu dijumlah.
// Cakupan SEMUA varian dapat bonus → 聞く ("to listen" + "to ask") mengalahkan
// 訊く ("to ask" saja) untuk item "To listen / ask".
function entryScore(entry, vars) {
  const perVariant = vars.map((v) => {
    let best = 0;
    entry.senses.forEach((glosses, si) => {
      const weight = si === 0 ? 1.35 : 1;
      for (const g of glosses) best = Math.max(best, glossScore([v], g) * weight);
    });
    return best;
  });
  const sum = perVariant.reduce((a, b) => a + b, 0);
  const covered = perVariant.filter((s) => s > 0).length;
  return sum + (covered === vars.length && vars.length > 1 ? 3 : 0);
}

// ── Pilih bentuk kanji terbaik untuk tiap item ──────────────────────────────
const out = {};
const noKanji = [];
const lowConfidence = [];
for (const item of kotoba) {
  const kana = String(item.char || '');
  // Lewati yang sudah ber-kanji / campuran simbol / multi-bentuk.
  if (KANJI.test(kana) || kana.includes('/') || /\s/.test(kana)) { noKanji.push(item.id); continue; }
  const reading = toHira(kana);
  const cands = byReading.get(reading) || [];
  if (!cands.length) { noKanji.push(item.id); continue; }

  const vars = variants(item.meaning);
  // Bentuk ber-angka/Latin (４時) kurang berguna untuk latihan kanji → kalah duluan.
  const rank = (c) => [/[0-9０-９A-Za-z]/.test(c.form) ? 1 : 0, -c.score, c.form.length];
  const scored = cands
    .map((c) => ({ ...c, score: entryScore(c, vars) }))
    .sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
      return 0;
    });

  const top = scored[0];
  if (!top || top.score < 4) { noKanji.push(item.id); continue; }
  const runnerUp = scored[1];
  if (runnerUp && runnerUp.score === top.score) lowConfidence.push([item.char, item.meaning, top.form, runnerUp.form]);

  out[item.id] = { k: toKanjiNumerals(top.form), r: reading };
}

// ── Tulis hasil ─────────────────────────────────────────────────────────────
const dest = path.join(root, 'src', 'data', 'kotobaKanji.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 0) + '\n', 'utf8');

const total = kotoba.length;
const covered = Object.keys(out).length;
console.log(`kotoba: ${total} | punya bentuk kanji: ${covered} | tanpa: ${total - covered}`);
console.log(`ukuran: ${(fs.statSync(dest).size / 1024).toFixed(1)} KB`);
console.log(`seri skor sama (tetap dipilih, urutan kamus): ${lowConfidence.length}`);
console.log(lowConfidence.slice(0, 12).map((a) => `${a[0]}(${a[1]}) ${a[2]}/${a[3]}`).join('\n'));
console.log('\ncontoh:');
for (const id of ['v_taberu', 'v_nomu', 'v_kyou', 'v_hashi', 'v_hashi_bridge', 'v_kami', 'v_kami_paper', 'v_toru', 'v_toru_photo', 'v_au', 'v_gakkou', 'v_denwa', 'v_ookii', 'v_miru', 'v_takai', 'v_kaeru', 'v_hanasu', 'v_yomu', 'v_kiku']) {
  if (out[id]) console.log('  ', id.padEnd(16), out[id].k, `(${out[id].r})`);
}
