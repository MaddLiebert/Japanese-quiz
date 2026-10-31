import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toFurigana, hasKanji } from './furigana.js';

const read = (name) =>
  JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));

const kanjiMap = read('kotobaKanji');

test('hasKanji: mendeteksi kanji, bukan kana/katakana', () => {
  assert.equal(hasKanji('食'), true);
  assert.equal(hasKanji('食べる'), true);
  assert.equal(hasKanji('たべる'), false);
  assert.equal(hasKanji('コーヒー'), false);
  assert.equal(hasKanji(''), false);
  assert.equal(hasKanji(null), false);
});

test('toFurigana: okurigana jadi jangkar — bacaan hanya di atas kanji', () => {
  assert.equal(toFurigana('食べる', 'たべる'), '食[た]べる');
  assert.equal(toFurigana('飲む', 'のむ'), '飲[の]む');
  assert.equal(toFurigana('大きい', 'おおきい'), '大[おお]きい');
  assert.equal(toFurigana('帰る', 'かえる'), '帰[かえ]る');
});

test('toFurigana: kata semua-kanji → ruby satu blok', () => {
  assert.equal(toFurigana('水', 'みず'), '水[みず]');
  assert.equal(toFurigana('教室', 'きょうしつ'), '教室[きょうしつ]');
  assert.equal(toFurigana('電話', 'でんわ'), '電話[でんわ]');
});

test('toFurigana: okurigana di tengah kata (の/さん/ご) tetap benar', () => {
  // Regresi: pemotongan dari depan memberi 男[おと]の子[この].
  assert.equal(toFurigana('男の子', 'おとこのこ'), '男[おとこ]の子[こ]');
  assert.equal(toFurigana('女の子', 'おんなのこ'), '女[おんな]の子[こ]');
  assert.equal(toFurigana('お父さん', 'おとうさん'), 'お父[とう]さん');
  assert.equal(toFurigana('ご飯', 'ごはん'), 'ご飯[はん]');
});

test('toFurigana: bacaan berawalan sama dengan okurigana (痛い/歌う)', () => {
  // Regresi: tanpa backtracking, 痛[い]たい gagal karena "い" juga di posisi 1.
  assert.equal(toFurigana('痛い', 'いたい'), '痛[いた]い');
  assert.equal(toFurigana('歌う', 'うたう'), '歌[うた]う');
  assert.equal(toFurigana('五つ', 'いつつ'), '五[いつ]つ');
});

test('toFurigana: kana katakana di bentuk kanji tetap tampil aslinya', () => {
  assert.equal(toFurigana('消しゴム', 'けしごむ'), '消[け]しゴム');
  assert.equal(toFurigana('バス停', 'ばすてい'), 'バス停[てい]');
});

test('toFurigana: menolak input yang tak sinkron / tak perlu ruby', () => {
  assert.equal(toFurigana('食べる', 'のむ'), null);     // bacaan beda
  assert.equal(toFurigana('食べる', 'たべ'), null);     // kurang
  assert.equal(toFurigana('たべる', 'たべる'), null);   // tak ada kanji
  assert.equal(toFurigana('食べる', '食'), null);       // bacaan ber-kanji
  assert.equal(toFurigana('', 'たべる'), null);
  assert.equal(toFurigana(null, null), null);
});

test('peta kanji: SEMUA 634 kata bisa dibuat furigana (tidak ada yang gagal)', () => {
  const bad = [];
  for (const [id, e] of Object.entries(kanjiMap)) {
    if (!toFurigana(e.k, e.r)) bad.push(`${id}:${e.k}(${e.r})`);
  }
  assert.deepEqual(bad, [], `gagal furigana: ${bad.slice(0, 10).join(', ')}`);
});

test('peta kanji: markup furigana bisa direkonstruksi jadi bacaan penuh', () => {
  for (const e of Object.values(kanjiMap)) {
    const markup = toFurigana(e.k, e.r);

    // Teks dasar (tanpa kurung siku) harus persis bentuk kanjinya.
    const plain = markup.replace(/\[(.*?)\]/g, '');
    assert.equal(plain, e.k, `${e.k}: teks dasar harus sama dengan bentuk kanji`);

    // Rekonstruksi: ruby + okurigana (kana yang tertulis apa adanya) = bacaan.
    let rebuilt = '';
    let last = 0;
    for (const m of markup.matchAll(/(.*?)\[(.*?)\]/g)) {
      rebuilt += m[1].replace(/[^ぁ-ゖァ-ヶー]/g, '');  // kana di depan blok kanji
      rebuilt += m[2];
      last = m.index + m[0].length;
    }
    rebuilt += markup.slice(last);
    // Kana pada bentuk asli boleh katakana (消しゴム) → bandingkan dalam hiragana.
    const toHira = (s) => [...s].map((ch) => {
      const c = ch.codePointAt(0);
      return c >= 0x30a1 && c <= 0x30f6 ? String.fromCodePoint(c - 0x60) : ch;
    }).join('');
    assert.equal(toHira(rebuilt), toHira(e.r), `${e.k}: bacaan tidak bisa direkonstruksi`);
  }
});
