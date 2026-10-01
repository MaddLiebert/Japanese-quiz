import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIALS, DEFAULT_TUTORIAL_KEY, tutorialFor, tutorialKey,
  emptySeen, ensureSeen, hasSeen, markSeen, unseenCount,
  ensureTutorialHidden, tutorialButtonVisible,
} from './tutorials.js';

test('tutorialFor: path dikenal → topik yang tepat', () => {
  assert.equal(tutorialFor('/').key, 'home');
  assert.equal(tutorialFor('/learn').key, 'learn');
  assert.equal(tutorialFor('/speaking').key, 'speaking');
  assert.equal(tutorialFor('/n5-exam').key, 'n5-exam');
});

test('tutorialFor: path asing / kosong → fallback home', () => {
  assert.equal(tutorialFor('/tidak-ada').key, DEFAULT_TUTORIAL_KEY);
  assert.equal(tutorialFor('').key, DEFAULT_TUTORIAL_KEY);
  assert.equal(tutorialFor(undefined).key, DEFAULT_TUTORIAL_KEY);
  assert.equal(tutorialFor(null).key, DEFAULT_TUTORIAL_KEY);
});

test('tutorialFor: trailing slash dinormalkan', () => {
  assert.equal(tutorialFor('/learn/').key, 'learn');
  assert.equal(tutorialFor('///').key, DEFAULT_TUTORIAL_KEY);
});

test('TUTORIALS: tiap topik punya field lengkap + baris teks ID & EN', () => {
  assert.ok(TUTORIALS.length >= 10);
  for (const t of TUTORIALS) {
    assert.ok(t.key && typeof t.key === 'string', 'key');
    assert.ok(t.emblem, 'emblem ' + t.key);
    assert.ok(t.title && t.title_en, 'title ' + t.key);
    assert.ok(Array.isArray(t.paths) && t.paths.length > 0, 'paths ' + t.key);
    assert.ok(Array.isArray(t.lines) && t.lines.length > 0, 'lines ' + t.key);
    for (const ln of t.lines) {
      assert.ok(ln.text && ln.text_en, 'line text ' + t.key);
    }
  }
});

test('TUTORIALS: key unik & path unik', () => {
  const keys = TUTORIALS.map((t) => t.key);
  assert.equal(new Set(keys).size, keys.length);
  const paths = TUTORIALS.flatMap((t) => t.paths);
  assert.equal(new Set(paths).size, paths.length);
});

test('emptySeen: objek kosong', () => {
  assert.deepEqual(emptySeen(), {});
});

test('ensureSeen: sampah → objek kosong; objek valid → apa adanya', () => {
  assert.deepEqual(ensureSeen(null), {});
  assert.deepEqual(ensureSeen(undefined), {});
  assert.deepEqual(ensureSeen([]), {});
  assert.deepEqual(ensureSeen('x'), {});
  const ok = { learn: true };
  assert.deepEqual(ensureSeen(ok), ok);
});

test('hasSeen/markSeen: tandai per-topik, tidak saling bocor, immutable', () => {
  const seen = markSeen({}, '/learn');
  assert.equal(hasSeen(seen, '/learn'), true);
  assert.equal(hasSeen(seen, '/speaking'), false);
  assert.deepEqual(seen, { learn: true });
});

test('markSeen: idempotent (tandai 2× = sama)', () => {
  const a = markSeen({}, '/shop');
  const b = markSeen(a, '/shop');
  assert.deepEqual(a, b);
});

test('markSeen: fallback path tetap menandai topik home', () => {
  assert.deepEqual(markSeen({}, '/tidak-ada'), { [DEFAULT_TUTORIAL_KEY]: true });
});

test('unseenCount: hitung topik yang belum dibaca', () => {
  assert.equal(unseenCount({}), TUTORIALS.length);
  assert.equal(unseenCount({ home: true, learn: true }), TUTORIALS.length - 2);
});

test('tutorialKey: sama dengan key tutorialFor', () => {
  assert.equal(tutorialKey('/speaking'), 'speaking');
  assert.equal(tutorialKey('/xyz'), DEFAULT_TUTORIAL_KEY);
});

// ── Preferensi tombol Tutorial (sembunyikan setelah hafal) ───────────────────
test('ensureTutorialHidden: hanya true yang dianggap true (anti data kotor)', () => {
  assert.equal(ensureTutorialHidden(true), true);
  assert.equal(ensureTutorialHidden(false), false);
  assert.equal(ensureTutorialHidden(undefined), false);
  assert.equal(ensureTutorialHidden(null), false);
  assert.equal(ensureTutorialHidden('true'), false);   // string bukan true
  assert.equal(ensureTutorialHidden(1), false);
});

test('tutorialButtonVisible: kebalikan dari hidden (default tampil)', () => {
  assert.equal(tutorialButtonVisible(true), false);    // hidden → tak tampil
  assert.equal(tutorialButtonVisible(false), true);
  assert.equal(tutorialButtonVisible(undefined), true); // default: tampil
  assert.equal(tutorialButtonVisible('x'), true);
});
