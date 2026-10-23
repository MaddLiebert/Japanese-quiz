import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

// Aturan repo: modul murni dilarang import JSON → test baca manual.
const load = (name) =>
  JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), "utf8"));
const notes = (name) => {
  const all = load(name);
  delete all._readme;
  return all;
};

const kanjiData = load("kanji");
const grammarData = load("grammar");
const kanjiNotes = notes("kanjiNotes");
const grammarNotes = notes("grammarNotes");

// Kontrak: tiap kanji & tiap partikel/pola wajib punya penjelasan bahasa Indonesia.
// Entri data baru tanpa catatan = test gagal, bukan diam-diam kosong di UI.
test("semua kanji punya penjelasan Indonesia", () => {
  const missing = kanjiData.filter((k) => !kanjiNotes[k.id]?.desc).map((k) => `${k.id}/${k.char}`);
  assert.deepEqual(missing, []);
});

test("semua grammar/partikel punya penjelasan Indonesia", () => {
  const missing = grammarData.filter((g) => !grammarNotes[g.id]?.desc).map((g) => `${g.id}/${g.char}`);
  assert.deepEqual(missing, []);
});

test("penjelasan berisi kegunaan + minimal satu contoh lengkap", () => {
  const bad = [...kanjiData, ...grammarData]
    .filter((item) => {
      const n = kanjiNotes[item.id] || grammarNotes[item.id];
      return !n || n.desc.length < 40 || !Array.isArray(n.ex) || n.ex.length === 0
        || n.ex.some((e) => !e.w || !e.k || !e.m);
    })
    .map((i) => i.id);
  assert.deepEqual(bad, []);
});

test("tidak ada catatan yatim (id tak dikenal data)", () => {
  const ids = new Set([...kanjiData, ...grammarData].map((i) => i.id));
  const orphan = [...Object.keys(kanjiNotes), ...Object.keys(grammarNotes)].filter((id) => !ids.has(id));
  assert.deepEqual(orphan, []);
});
