import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gojoTechniqueFor, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE,
  gojoSpheres, gojoBolts, gojoBoltPath, gojoStars,
  GOJO_VOID, GOJO_RIM,
  GOJO_INK, GOJO_FLASH, gojoImpactFocus, gojoImpactStar,
  gojoSpeedLines, gojoHalftone, gojoOno,
} from './gojoFx.js';

// ── Teknik per jawaban (kanon 蒼 → 赫 → 茈 → Domain) ─────────────────────────

test('gojoTechniqueFor: benar#1 = ao, benar#2 = aka', () => {
  assert.equal(gojoTechniqueFor('correct', 1), 'ao');
  assert.equal(gojoTechniqueFor('correct', 2), 'aka');
});

test('gojoTechniqueFor: streak 3 = murasaki (penyatuan ao+aka)', () => {
  assert.equal(gojoTechniqueFor('streak', 3), 'murasaki');
});

test('gojoTechniqueFor: milestone 5/10/20/… = murasaki', () => {
  for (const m of [5, 10, 20, 30, 40, 60, 70, 80, 90]) {
    assert.equal(gojoTechniqueFor('streak', m), 'murasaki', `milestone ${m}`);
  }
});

test('gojoTechniqueFor: non-milestone setelah 3 = ao/aka selang-seling', () => {
  assert.equal(gojoTechniqueFor('streak', 4), 'ao');
  assert.equal(gojoTechniqueFor('streak', 6), 'aka');
  assert.equal(gojoTechniqueFor('streak', 7), 'ao');
  assert.equal(gojoTechniqueFor('streak', 8), 'aka');
  assert.equal(gojoTechniqueFor('streak', 9), 'ao');
});

test('gojoTechniqueFor: 50 = domain, 100 = domain_zenith', () => {
  assert.equal(gojoTechniqueFor('streak', 50), 'domain');
  assert.equal(gojoTechniqueFor('streak', 100), 'domain_zenith');
  assert.equal(gojoTechniqueFor('streak', 150), 'domain_zenith');
});

test('gojoTechniqueFor: salah = null (menyusul, tanpa retak)', () => {
  assert.equal(gojoTechniqueFor('wrong', 0), null);
  assert.equal(gojoTechniqueFor('wrong', 7), null);
});

// ── Milestone helper ────────────────────────────────────────────────────────

test('isGojoMilestone: cocok dengan MILESTONES app', () => {
  for (const m of [3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
    assert.equal(isGojoMilestone(m), true, `${m} harus milestone`);
  }
  for (const n of [0, 1, 2, 4, 6, 7, 9, 11, 99]) {
    assert.equal(isGojoMilestone(n), false, `${n} bukan milestone`);
  }
});

// ── Retak (HANYA streak) ────────────────────────────────────────────────────

test('gojoCrackCount: naik per level, ada batas atas', () => {
  assert.ok(gojoCrackCount(3) < gojoCrackCount(20));
  assert.ok(gojoCrackCount(100) <= 14);
  assert.ok(gojoCrackCount(3) >= 3);
});

// ── Style + warna ───────────────────────────────────────────────────────────

test('GOJO_STYLE punya warna & kanji untuk tiap teknik', () => {
  for (const t of ['ao', 'aka', 'murasaki', 'domain', 'domain_zenith']) {
    assert.ok(GOJO_STYLE[t].color, `${t} tanpa warna`);
    assert.ok(GOJO_STYLE[t].kanji, `${t} tanpa kanji`);
  }
  assert.equal(GOJO_STYLE.ao.kanji, '蒼');
  assert.equal(GOJO_STYLE.aka.kanji, '赫');
  assert.equal(GOJO_STYLE.murasaki.kanji, '茈');
  assert.equal(GOJO_STYLE.domain.kanji, '無量空処');
});

test('GOJO_VOID & GOJO_RIM = hex valid (petir hitam + rim kebaca 2 tema)', () => {
  assert.match(GOJO_VOID, /^#[0-9a-f]{6}$/i);
  assert.match(GOJO_RIM, /^#[0-9a-f]{6}$/i);
  assert.notEqual(GOJO_VOID.toLowerCase(), '#000000', 'jangan hitam pekat (tak kebaca di tema gelap)');
});

// ── Bahasa anime: tinta + flash ─────────────────────────────────────────────

test('GOJO_INK & GOJO_FLASH = hex valid (outline tinta + flash frame)', () => {
  assert.match(GOJO_INK, /^#[0-9a-f]{6}$/i);
  assert.match(GOJO_FLASH, /^#[0-9a-f]{6}$/i);
  assert.equal(GOJO_FLASH.toLowerCase(), '#ffffff');
});

test('gojoImpactFocus: ao=kanan, aka=kiri, murasaki=tengah', () => {
  assert.ok(gojoImpactFocus('ao').xVw > 0, 'ao fokus di kanan');
  assert.ok(gojoImpactFocus('aka').xVw < 0, 'aka fokus di kiri');
  assert.equal(gojoImpactFocus('murasaki').xVw, 0, 'murasaki fokus di tengah');
  assert.equal(gojoImpactFocus('ao').yVw, 0);
});

// ── Impact star (bintang ledakan anime) ─────────────────────────────────────

test('gojoImpactStar: deterministik, spike sesuai, titik valid 0..100', () => {
  const a = gojoImpactStar(1, () => 0.5, 8);
  const b = gojoImpactStar(1, () => 0.5, 8);
  assert.deepEqual(a, b);
  assert.equal(a.spikes, 8);
  const pts = a.points.split(' ').map((s) => s.split(',').map(Number));
  assert.equal(pts.length, 16, 'star punya 2x spike titik (luar+dalam)');
  for (const [x, y] of pts) {
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `titik (${x},${y}) di luar 0..100`);
  }
  const maxR = Math.max(...pts.map(([x, y]) => Math.hypot(x - 50, y - 50)));
  assert.ok(maxR >= 40, `star harus besar (maxR=${maxR.toFixed(1)})`);
});

// ── 集中線 speed lines (garis tinta dari fokus) ─────────────────────────────

test('gojoSpeedLines: deterministik, ada, dan tidak lewat tengah utk ao/aka', () => {
  const a = gojoSpeedLines('ao', 1, () => 0.5, 14);
  const b = gojoSpeedLines('ao', 1, () => 0.5, 14);
  assert.deepEqual(a, b);
  assert.ok(a.length >= 8, 'minimal 8 garis');
  for (const l of a) {
    assert.ok(l.width > 0);
    for (const [x, y] of [l.from, l.to]) {
      assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `titik (${x},${y}) di luar 0..100`);
    }
  }
  for (const l of gojoSpeedLines('ao', 1, () => 0.5, 14)) {
    assert.ok(l.to[0] > 50, 'ao: ujung garis harus tetap di kanan (tidak ke tengah)');
  }
  for (const l of gojoSpeedLines('aka', 1, () => 0.5, 14)) {
    assert.ok(l.to[0] < 50, 'aka: ujung garis harus tetap di kiri');
  }
});

// ── Screentone halftone (shading manga) ─────────────────────────────────────

test('gojoHalftone: deterministik, jumlah & posisi valid', () => {
  const a = gojoHalftone(1, () => 0.5, 18);
  const b = gojoHalftone(1, () => 0.5, 18);
  assert.deepEqual(a, b);
  assert.equal(a.length, 18);
  for (const d of a) {
    assert.ok(d.x >= 0 && d.x <= 100 && d.y >= 0 && d.y <= 100);
    assert.ok(d.size > 0);
  }
});

// ── オノマトペ (teks bunyi anime) ───────────────────────────────────────────

test('gojoOno: teks bunyi per teknik', () => {
  assert.equal(gojoOno('ao'), 'ドン');
  assert.equal(gojoOno('aka'), 'ゴッ');
  assert.equal(gojoOno('murasaki'), 'ズドン');
  assert.ok(gojoOno('domain').length > 0);
  assert.equal(gojoOno(null), '');
});

// ── Bola (ao/aka DIAM di pinggir, murasaki tabrakan di tengah) ──────────────

test('gojoSpheres: ao = dari KANAN, DIAM di pinggir (tidak ke tengah)', () => {
  const s = gojoSpheres('ao');
  assert.equal(s.length, 1);
  assert.ok(s[0].fromVw > 0, 'mulai dari kanan');
  assert.ok(s[0].anchorVw > 0, 'berhenti di pinggir kanan, bukan tengah');
  assert.ok(s[0].anchorVw >= 20, 'anchor cukup ke pinggir');
});

test('gojoSpheres: aka = dari KIRI, DIAM di pinggir', () => {
  const s = gojoSpheres('aka');
  assert.equal(s.length, 1);
  assert.ok(s[0].fromVw < 0, 'mulai dari kiri');
  assert.ok(s[0].anchorVw < 0, 'berhenti di pinggir kiri');
  assert.ok(s[0].anchorVw <= -20, 'anchor cukup ke pinggir');
});

test('gojoSpheres: murasaki = DUA bola (kanan + kiri) tabrakan di TENGAH', () => {
  const s = gojoSpheres('murasaki');
  assert.equal(s.length, 2);
  assert.equal(s.filter((b) => b.fromVw > 0).length, 1, 'satu dari kanan');
  assert.equal(s.filter((b) => b.fromVw < 0).length, 1, 'satu dari kiri');
  for (const b of s) assert.equal(b.anchorVw, 0, 'semua berakhir di tengah (titik tabrakan)');
});

test('gojoSpheres: warna bola = warna kanon, domain tanpa bola', () => {
  assert.equal(gojoSpheres('ao')[0].color, GOJO_STYLE.ao.color);
  assert.equal(gojoSpheres('aka')[0].color, GOJO_STYLE.aka.color);
  const mura = gojoSpheres('murasaki');
  assert.equal(mura.find((b) => b.id === 'ao').color, GOJO_STYLE.ao.color);
  assert.equal(mura.find((b) => b.id === 'aka').color, GOJO_STYLE.aka.color);
  assert.deepEqual(gojoSpheres('domain'), []);
  assert.deepEqual(gojoSpheres('domain_zenith'), []);
  assert.deepEqual(gojoSpheres(null), []);
});

// ── Partikel = serpihan tinta hard-edge ─────────────────────────────────────

test('gojoParticles: serpihan tinta hard-edge, ada len & deterministik', () => {
  const a = gojoParticles('ao', 1, () => 0.5);
  const b = gojoParticles('ao', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.ok(a.length >= 12 && a.length <= 30);
  for (const p of a) {
    assert.equal(p.hard, true, 'serpihan harus hard-edge (bukan blur)');
    assert.ok(p.len > 0, 'serpihan harus punya panjang');
  }
});

test('gojoParticles: murasaki = spiral, aka = ledak keluar, ao = hisap masuk', () => {
  const ao = gojoParticles('ao', 1, () => 0.5);
  const aka = gojoParticles('aka', 1, () => 0.5);
  const mura = gojoParticles('murasaki', 1, () => 0.5);
  assert.equal(ao[0].out, false, 'ao = hisap (tidak keluar)');
  assert.equal(aka[0].out, true, 'aka = ledak keluar');
  assert.equal(mura[0].spiral, true, 'murasaki = spiral');
});

// ── Petir hitam (dari tepi, TIDAK sampai tengah) ────────────────────────────

test('gojoBolts: semua titik jauh dari tengah (jangan ke tengah)', () => {
  for (const t of ['ao', 'aka', 'murasaki']) {
    const bolts = gojoBolts(t, 1, () => 0.5);
    assert.ok(bolts.length >= 3, `${t}: minimal 3 petir`);
    for (const b of bolts) {
      for (const [x, y] of b.points) {
        const dist = Math.hypot(x - 50, y - 50);
        assert.ok(dist >= 16, `${t}: titik petir (${x},${y}) terlalu dekat tengah`);
      }
    }
  }
});

test('gojoBoltPath: polyline valid di ruang 0..100, nempel di tepi bola', () => {
  const pts = gojoBoltPath(() => 0.5).split(' ').map((s) => s.split(',').map(Number));
  assert.ok(pts.length >= 4, 'minimal 4 titik');
  for (const [x, y] of pts) {
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `titik (${x},${y}) di luar 0..100`);
    const r = Math.hypot(x - 50, y - 50);
    assert.ok(r >= 30, `titik harus di pinggir bola (r=${r.toFixed(1)})`);
  }
});

// ── Bintang 無量空処 (domain) ───────────────────────────────────────────────

test('gojoStars: deterministik & jumlah sesuai', () => {
  const a = gojoStars(1, 40, () => 0.5);
  const b = gojoStars(1, 40, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 40);
  for (const s of a) {
    assert.ok(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100, 'bintang di dalam layar');
    assert.ok(s.size > 0);
  }
});
