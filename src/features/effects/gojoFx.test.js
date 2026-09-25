import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gojoTechniqueFor, gojoPreviewStreak, isGojoMilestone, gojoCrackCount, gojoParticles, GOJO_STYLE,
  gojoSpheres, gojoBolts, gojoBoltPath, gojoStars,
  GOJO_VOID, GOJO_RIM,
  GOJO_INK, GOJO_FLASH, gojoImpactFocus, gojoImpactStar,
  gojoSpeedLines, gojoHalftone, gojoOno,
  GOJO_CORE, gojoSphereShape, gojoOrbitRings, gojoRibbons, gojoTendrils, gojoHalo,
  gojoSphereAnim, nextGojoBalls, GOJO_BALLS_EMPTY,
  gojoBallLabel, gojoBallAura, gojoTensionLines, gojoCharge,
  darkenHex, gojoBallVignette, gojoBallWash,
  gojoBallLayout, GOJO_BALL_BREAKPOINT,
  gojoMurasakiBurst,
  GOJO_ULT_THRESHOLD, gojoUltReady, gojoCurseCharge,
  gojoDomainTimeline, gojoSequentialChars,
  gojoNebulaSpots, GOJO_NEBULA_COLORS,
  GOJO_DOMAIN_DURATION_S, gojoDomainLeft, gojoDomainStartDelayMs,
  GOJO_CAST_VOICE,
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

test('gojoTechniqueFor: 50/100 = murasaki (domain kini dari bar energi kutukan)', () => {
  assert.equal(gojoTechniqueFor('streak', 50), 'murasaki');
  assert.equal(gojoTechniqueFor('streak', 100), 'murasaki');
});

test('gojoTechniqueFor: TIDAK PERNAH mengembalikan domain', () => {
  for (let s = 1; s <= 200; s++) {
    const t = gojoTechniqueFor('streak', s);
    assert.ok(t !== 'domain' && t !== 'domain_zenith', `streak ${s} → ${t}`);
  }
});

test('gojoTechniqueFor: salah = null (menyusul, tanpa retak)', () => {
  assert.equal(gojoTechniqueFor('wrong', 0), null);
  assert.equal(gojoTechniqueFor('wrong', 7), null);
});

// ── Preview dev (lompat streak tanpa quiz, dipakai DevPanel) ────────────────

test('gojoPreviewStreak: set target-1 supaya satu tembakan mendarat tepat di target', () => {
  assert.equal(gojoPreviewStreak(50), 49);
  assert.equal(gojoPreviewStreak('50'), 49);   // nilai dari <input> = string
  assert.equal(gojoPreviewStreak(100), 99);
  assert.equal(gojoPreviewStreak(2.7), 1);     // dibulatkan ke bawah
  // Kontrak: satu tembakan setelah set → teknik tepat di target.
  assert.equal(gojoTechniqueFor('correct', gojoPreviewStreak(3) + 1), 'murasaki');
  assert.equal(gojoTechniqueFor('correct', gojoPreviewStreak(50) + 1), 'murasaki');   // 50: kini murasaki
  assert.equal(gojoTechniqueFor('correct', gojoPreviewStreak(100) + 1), 'murasaki');  // 100: kini murasaki
});

test('gojoPreviewStreak: input tak valid/negatif → 0 (aman, mulai dari awal)', () => {
  for (const bad of [0, -5, '', 'abc', NaN, Infinity, null, undefined]) {
    assert.equal(gojoPreviewStreak(bad), 0, `input ${String(bad)}`);
  }
  assert.equal(gojoPreviewStreak(1), 0);   // target 1 → set 0 → tembakan jadi streak 1
});

// ── Energi kutukan 呪力 (bar, bukan streak) ─────────────────────────────────

test('gojoCurseCharge: clamp 0..20 (bar keisi tiap benar, berhenti di penuh)', () => {
  assert.equal(GOJO_ULT_THRESHOLD, 20);
  assert.equal(gojoCurseCharge(0), 0);
  assert.equal(gojoCurseCharge(7), 7);
  assert.equal(gojoCurseCharge(20), 20);
  assert.equal(gojoCurseCharge(35), 20, 'tidak lebih dari penuh');
  for (const bad of [-3, NaN, Infinity, null, undefined, '12']) {
    assert.equal(gojoCurseCharge(bad), 0, `input ${String(bad)}`);
  }
});

test('gojoUltReady: nyala tepat di 20 benar beruntun, aman utk input aneh', () => {
  assert.equal(GOJO_ULT_THRESHOLD, 20);
  assert.equal(gojoUltReady(19), false);
  assert.equal(gojoUltReady(20), true);
  assert.equal(gojoUltReady(21), true);
  for (const bad of [0, -3, NaN, Infinity, null, undefined, '20']) {
    assert.equal(gojoUltReady(bad), false, `input ${String(bad)}`);
  }
});

// ── Durasi domain 無量空処 (anti-overpower) ─────────────────────────────────

test('GOJO_DOMAIN_DURATION_S: durasi domain terbatas, bukan abadi', () => {
  assert.ok(Number.isInteger(GOJO_DOMAIN_DURATION_S));
  assert.ok(GOJO_DOMAIN_DURATION_S >= 15 && GOJO_DOMAIN_DURATION_S <= 60, '15-60 dtk');
});

test('gojoDomainLeft: sisa detik 0..durasi, aman utk input aneh', () => {
  const now = 1_000_000;
  assert.equal(gojoDomainLeft(now + 30_000, now), 30);
  assert.equal(gojoDomainLeft(now + 15_000, now), 15);
  assert.equal(gojoDomainLeft(now + 30_500, now), 30, 'clamp atas');
  assert.equal(gojoDomainLeft(now, now), 0);
  assert.equal(gojoDomainLeft(now - 1, now), 0);
  for (const bad of [NaN, Infinity, null, undefined]) {
    assert.equal(gojoDomainLeft(bad, now), 0, `endsAt ${String(bad)}`);
  }
});

test('gojoDomainStartDelayMs: hitung mundur mulai setelah cinematic settle', () => {
  const t = gojoDomainTimeline();
  assert.equal(gojoDomainStartDelayMs(), Math.round((t.settleStart + t.settleDur) * 1000));
  assert.ok(gojoDomainStartDelayMs() > 3000 && gojoDomainStartDelayMs() < 6000);
});

// ── Timeline cinematic & teks berurutan ─────────────────────────────────────

test('gojoDomainTimeline: urut naik, deterministik, durasi wajar', () => {
  const t = gojoDomainTimeline();
  assert.deepEqual(t, gojoDomainTimeline());
  assert.ok(t.darkDur > 0 && t.darkDur <= 1, 'fade gelap wajar');
  assert.ok(t.text2Start >= t.text1Start + 4 * t.text1Char, 'teks 2 mulai setelah teks 1 selesai');
  assert.ok(t.bangStart >= t.text2Start + 4 * t.text2Char, 'bigbang setelah semua teks muncul');
  assert.ok(t.settleStart >= t.bangStart + t.bangDur, 'settle setelah bigbang selesai');
  assert.ok(t.eyesStart >= t.text1Start, 'mata muncul saat teks mulai');
  assert.ok(t.eyesOpenDur > 0.4 && t.eyesOpenDur <= 2, 'buka mata wajar');
});

test('gojoDomainTimeline: teks sinkron dengan frasa suara ryoiki tenkai.mp3', () => {
  const t = gojoDomainTimeline();
  const v = GOJO_CAST_VOICE;
  // 領域展開: muncul saat frasa 1 diucapkan; 4 kanji habis = frasa 1 habis.
  assert.ok(Math.abs(t.text1Start - v.seg1Start) < 0.01, `領域展開 mulai ${t.text1Start}, frasa ${v.seg1Start}`);
  assert.ok(Math.abs(t.text1Start + 4 * t.text1Char - v.seg1End) < 0.01, '領域展開 selesai = akhir frasa 1');
  // 無量空処: BUKAN di tengah jeda (bug lama 1.5s) — mulai saat frasa 2 diucapkan.
  assert.ok(t.text2Start > v.seg1End, '無量空処 tidak muncul saat jeda suara');
  assert.ok(Math.abs(t.text2Start - v.seg2Start) < 0.01, `無量空処 mulai ${t.text2Start}, frasa ${v.seg2Start}`);
  assert.ok(Math.abs(t.text2Start + 4 * t.text2Char - v.seg2End) < 0.01, '無量空処 selesai = akhir frasa 2');
  // Beat setelah suara: bigbang & settle; cinematic tidak berakhir sebelum klip habis.
  assert.ok(t.bangStart >= v.seg2End, 'bigbang setelah frasa 2 habis');
  assert.ok(t.settleStart >= t.bangStart + t.bangDur, 'settle setelah bigbang');
  assert.ok(t.settleStart + t.settleDur >= v.dur, 'cinematic >= durasi klip suara');
});

test('gojoSequentialChars: 1 entry/karakter, delay naik, deterministik', () => {
  const a = gojoSequentialChars('領域展開', 0.5, 0.25);
  assert.deepEqual(a, gojoSequentialChars('領域展開', 0.5, 0.25));
  assert.equal(a.length, 4);
  assert.deepEqual(a.map((x) => x.ch), ['領', '域', '展', '開']);
  assert.deepEqual(a.map((x) => x.delayMs), [500, 750, 1000, 1250]);
  assert.deepEqual(gojoSequentialChars('', 0, 1), []);
  assert.deepEqual(gojoSequentialChars(null, 0, 1), []);
});

// ── Bercak ruang angkasa (pinggir kuis) ─────────────────────────────────────

test('gojoNebulaSpots: deterministik & jumlah sesuai', () => {
  const a = gojoNebulaSpots(1, 8, () => 0.5);
  assert.deepEqual(a, gojoNebulaSpots(1, 8, () => 0.5));
  assert.equal(a.length, 8);
  assert.equal(new Set(a.map((s) => s.id)).size, 8, 'id unik');
});

test('gojoNebulaSpots: semua di PINGGIR, warna dari palet, angka sehat', () => {
  for (let seed = 1; seed <= 5; seed++) {
    for (const s of gojoNebulaSpots(seed, 8, () => 0.5)) {
      const edge = s.x <= 22 || s.x >= 78 || s.y <= 22 || s.y >= 78;
      assert.ok(edge, `seed ${seed}: spot (${s.x.toFixed(1)},${s.y.toFixed(1)}) harus di pinggir`);
      assert.ok(GOJO_NEBULA_COLORS.includes(s.color), 'warna dari palet');
      assert.ok(s.size > 0 && s.opacity > 0 && s.opacity < 1, 'size/opacity sehat');
      assert.ok(s.delay >= 0 && s.delay <= 1, 'delay wajar');
    }
  }
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
  // Robustness: dengan RNG acak pun tidak boleh lewat tengah (banyak iterasi).
  for (let it = 0; it < 200; it++) {
    for (const l of gojoSpeedLines('ao', it, Math.random, 14)) {
      assert.ok(l.to[0] > 50, `ao acak: to[0]=${l.to[0]} lewat tengah`);
    }
    for (const l of gojoSpeedLines('aka', it, Math.random, 14)) {
      assert.ok(l.to[0] < 50, `aka acak: to[0]=${l.to[0]} lewat tengah`);
    }
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

// ── Timing bola: muncul perlahan (bukan pop-in instan) ──────────────────────

test('gojoSphereAnim: muncul PERLAHAN — opacity belum penuh di awal', () => {
  const a = gojoSphereAnim('ao');
  assert.ok(Array.isArray(a.times), 'times = keyframe opacity');
  // keyframe pertama opacity 0, dan belum penuh (1) di paruh awal
  assert.equal(a.times[0], 0, 'mulai dari transparan');
  const halfIdx = a.times.findIndex((t) => t >= 0.5);
  assert.ok(a.opacity[halfIdx] < 1, 'belum penuh di tengah → muncul perlahan');
  assert.ok(a.holdMs >= 1600, `efek bertahan cukup lama (>=1.6s), dapat ${a.holdMs}`);
});

test('gojoSphereAnim: durasi masuk (fade-in) cukup lama, bukan instan', () => {
  for (const t of ['ao', 'aka', 'murasaki']) {
    const a = gojoSphereAnim(t);
    assert.ok(a.fadeInMs >= 400, `${t}: fade-in >= 400ms, dapat ${a.fadeInMs}`);
  }
});

test('gojoSphereAnim: deterministik & domain kosong', () => {
  assert.deepEqual(gojoSphereAnim('ao'), gojoSphereAnim('ao'));
  assert.equal(gojoSphereAnim('domain'), null);
});

// ── Bola PERSIST antar jawaban (konsep user) ────────────────────────────────
// benar#1 ao → biru nempel kanan · benar#2 aka → merah nempel kiri (ao TETAP)
// benar#3 murasaki → dua bola ke tengah MELEDAK → reset (kosong)

test('nextGojoBalls: benar#1 ao → hanya bola ao', () => {
  const r = nextGojoBalls(GOJO_BALLS_EMPTY, 'ao');
  assert.deepEqual(r, { ao: true, aka: false });
});

test('nextGojoBalls: benar#2 aka → ao TETAP + aka muncul (dua bola)', () => {
  const afterAo = nextGojoBalls(GOJO_BALLS_EMPTY, 'ao');
  const r = nextGojoBalls(afterAo, 'aka');
  assert.equal(r.ao, true, 'ao masih ada saat aka muncul');
  assert.equal(r.aka, true);
});

test('nextGojoBalls: murasaki → PAKSA dua bola (kanon 茈 = 蒼+赫)', () => {
  // walau baru ao yang muncul, murasaki memaksa keduanya ada
  const r = nextGojoBalls({ ao: true, aka: false }, 'murasaki');
  assert.equal(r.ao, true);
  assert.equal(r.aka, true);
});

test('nextGojoBalls: setelah ledakan → reset kosong (bener#4 mulai dari nol)', () => {
  const r = nextGojoBalls({ ao: true, aka: true }, null);
  assert.deepEqual(r, { ao: false, aka: false });
  // dan #4 (ao) mulai bersih lagi
  assert.deepEqual(nextGojoBalls(r, 'ao'), { ao: true, aka: false });
});

test('nextGojoBalls: tidak mengubah input (immutable)', () => {
  const input = { ao: true, aka: false };
  nextGojoBalls(input, 'aka');
  assert.deepEqual(input, { ao: true, aka: false });
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

// ── Bola plasma: bentuk per teknik (mengikuti referensi JJK) ────────────────

test('GOJO_CORE = putih (inti menyala, bukan void hitam)', () => {
  assert.equal(GOJO_CORE.toLowerCase(), '#ffffff');
});

test('gojoSphereShape: ao=rings, aka=ribbons, murasaki=tendrils+halo', () => {
  const ao = gojoSphereShape('ao');
  assert.ok(ao.rings >= 2, 'ao = orbit rings');
  assert.equal(ao.ribbons, 0);
  assert.equal(ao.tendrils, 0);
  const aka = gojoSphereShape('aka');
  assert.ok(aka.ribbons >= 3, 'aka = pita vortex');
  assert.equal(aka.rings, 0);
  const mura = gojoSphereShape('murasaki');
  assert.ok(mura.tendrils >= 4, 'murasaki = cabang petir');
  assert.ok(mura.halo >= 1, 'murasaki = halo besar');
});

test('gojoOrbitRings: deterministik, jumlah = shape, elips (rx>ry)', () => {
  const a = gojoOrbitRings('ao', 1, () => 0.5);
  const b = gojoOrbitRings('ao', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, gojoSphereShape('ao').rings);
  for (const r of a) {
    assert.ok(r.rx > r.ry, 'harus elips (miring)');
    assert.ok(r.width > 0 && r.dur > 0);
  }
  assert.equal(gojoOrbitRings('aka', 1, () => 0.5).length, 0, 'aka tanpa rings');
});

test('gojoRibbons: deterministik, jumlah = shape, pita tebal', () => {
  const a = gojoRibbons('aka', 1, () => 0.5);
  const b = gojoRibbons('aka', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, gojoSphereShape('aka').ribbons);
  for (const r of a) assert.ok(r.width >= 2, 'pita harus tebal');
});

test('gojoTendrils: deterministik, titik valid 0..100', () => {
  const a = gojoTendrils('murasaki', 1, () => 0.5);
  const b = gojoTendrils('murasaki', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, gojoSphereShape('murasaki').tendrils);
  for (const t of a) {
    assert.ok(t.points.length >= 4, 'tendril minimal 4 titik');
    for (const [x, y] of t.points) {
      assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `titik (${x},${y}) di luar 0..100`);
    }
  }
});

test('gojoHalo: hanya murasaki, 1 cincin', () => {
  assert.equal(gojoHalo('murasaki', 1, () => 0.5).length, 1);
  assert.equal(gojoHalo('ao', 1, () => 0.5).length, 0);
});

// ── Drama bola persist (ao/aka): label kanji + 集中線 + charge ring ──────────
// Keluhan user: "ao sama aka kurang dramatis kek kosong gitu gak mencekam sama
// teks ao aka nya gak ada". Bola persist harus tetap dramatis & ada teks 蒼/赫.

test('gojoBallLabel: ao=蒼(kanan), aka=赫(kiri), lain=null', () => {
  const ao = gojoBallLabel('ao');
  assert.equal(ao.kanji, '蒼');
  assert.equal(ao.side, 'right');
  assert.equal(ao.color, GOJO_STYLE.ao.color);
  const aka = gojoBallLabel('aka');
  assert.equal(aka.kanji, '赫');
  assert.equal(aka.side, 'left');
  assert.equal(gojoBallLabel('murasaki'), null);
  assert.equal(gojoBallLabel(null), null);
});

test('gojoTensionLines: hanya ao/aka, deterministik, tetap di sisinya (tidak ke tengah)', () => {
  assert.equal(gojoTensionLines('murasaki', 1, () => 0.5).length, 0);
  assert.equal(gojoTensionLines(null, 1, () => 0.5).length, 0);
  const a = gojoTensionLines('ao', 1, () => 0.5);
  const b = gojoTensionLines('ao', 1, () => 0.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 24);
  for (const l of a) {
    for (const p of [l.from, l.to]) {
      assert.ok(p[0] >= 50 && p[0] <= 100, `ao: x=${p[0]} harus di kanan (>=50)`);
      assert.ok(p[1] >= 0 && p[1] <= 100, 'y dalam 0..100');
    }
    assert.ok(l.width > 0);
  }
  for (const l of gojoTensionLines('aka', 1, () => 0.5)) {
    for (const p of [l.from, l.to]) assert.ok(p[0] <= 50, `aka: x=${p[0]} harus di kiri`);
  }
  // Robustness acak: tetap tidak melewati tengah.
  for (let it = 0; it < 200; it++) {
    for (const l of gojoTensionLines('ao', it, Math.random)) {
      assert.ok(l.from[0] >= 50 && l.to[0] >= 50, `ao acak lewat tengah (${l.from[0]},${l.to[0]})`);
    }
    for (const l of gojoTensionLines('aka', it, Math.random)) {
      assert.ok(l.from[0] <= 50 && l.to[0] <= 50, `aka acak lewat tengah (${l.from[0]},${l.to[0]})`);
    }
  }
});

test('gojoCharge: ao/aka punya parameter denyut, lain null', () => {
  for (const t of ['ao', 'aka']) {
    const c = gojoCharge(t);
    assert.ok(c && c.ringDur > 0 && c.ringScale > 1, `${t}: charge valid`);
  }
  assert.equal(gojoCharge('murasaki'), null);
  assert.equal(gojoCharge(null), null);
});

// ── Vibe background gelap (warna lebih gelap dari bola) ─────────────────────
// Permintaan user: "gw mu vibe background di ao sama aka pas muncul lebih gelap
// gitu pake warna yang lebih gelap dari si bola nya".

test('darkenHex: menggelapkan hex, hasil lebih gelap & format valid', () => {
  const d = darkenHex('#00b0ff', 0.3);
  assert.match(d, /^#[0-9a-f]{6}$/, 'harus hex 6 digit');
  const lum = (h) => {
    const n = parseInt(h.slice(1), 16);
    return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
  };
  assert.ok(lum(d) < lum('#00b0ff'), 'hasil harus lebih gelap');
  assert.equal(darkenHex('#00b0ff', 1), '#00b0ff', 'faktor 1 = warna sama');
  assert.equal(darkenHex('#ffffff', 0), '#000000', 'faktor 0 = hitam');
});

test('gojoBallVignette: ao/aka punya warna gelap (lebih gelap dari bola) + titik fokus sisi', () => {
  assert.equal(gojoBallVignette('murasaki'), null);
  assert.equal(gojoBallVignette(null), null);
  const lum = (h) => {
    const n = parseInt(h.slice(1), 16);
    return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
  };
  const ao = gojoBallVignette('ao');
  assert.match(ao.dark, /^#[0-9a-f]{6}$/);
  assert.ok(lum(ao.dark) < lum(GOJO_STYLE.ao.color), 'vignette ao harus lebih gelap dari bola');
  assert.equal(ao.side, 'right');
  const aka = gojoBallVignette('aka');
  assert.ok(lum(aka.dark) < lum(GOJO_STYLE.aka.color), 'vignette aka harus lebih gelap dari bola');
  assert.equal(aka.side, 'left');
});

// ── Wash sisi bola di HP (aura latar ala PC) ────────────────────────────────
// Permintaan user: "efek di hp cuma bola2 doang... kaya di pc kan ada aura2
// ungu sama merah gitu". Formula desktop = 0px di layar 390px → wash tidak
// pernah tampil di HP. Wash HP = ellipse di sudut bola, diuji AMAN geometri.

test('gojoBallWash: desktop = formula lama persis (tanpa regresi)', () => {
  const v = gojoBallVignette('ao');
  const w = gojoBallWash('ao', 1264, 800);
  assert.equal(w.mobile, false);
  assert.equal(
    w.background,
    `radial-gradient(ellipse max(0px, min(30vw, 50vw - 300px)) 135% at 100% 50%, ${v.dark} 0 70%, ${v.dark}00 100%)`,
  );
  const a = gojoBallWash('aka', 1264, 800);
  assert.ok(a.background.includes('at 0% 50%'), 'aka fokus kiri');
  assert.equal(gojoBallWash('murasaki', 1264, 800), null);
  assert.equal(gojoBallWash(null, 1264, 800), null);
  // Batas breakpoint: < 768 = HP, ≥ 768 = desktop.
  assert.equal(gojoBallWash('ao', 767, 900).mobile, true);
  assert.equal(gojoBallWash('ao', 768, 900).mobile, false);
});

test('gojoBallWash: HP = wash di sudut bola, TIDAK menyentuh konten kuis', () => {
  const vw = 390, vh = 844;
  for (const [tech, side] of [['ao', 'right'], ['aka', 'left']]) {
    const w = gojoBallWash(tech, vw, vh);
    assert.equal(w.mobile, true);
    assert.equal(w.side, side);
    assert.ok(w.rxPx > 0 && w.ryPx > 0, 'geometri numerik untuk uji aman');
    // Background = warna gelap bola + memudar transparan (bukan kotak keras).
    const dark = gojoBallVignette(tech).dark;
    assert.equal(
      w.background,
      `radial-gradient(ellipse 46vw 14.5vh at ${side === 'right' ? '100%' : '0%'} 20%, ${dark} 0 40%, ${dark}99 70%, ${dark}00 100%)`,
    );
    // Wash tetap "kaya" (lebar), bukan titik kecil.
    assert.ok(w.rxPx >= vw * 0.4, `wash terlalu sempit (${w.rxPx}px)`);
    assert.ok(w.ryPx >= vh * 0.12, `wash terlalu tipis (${w.ryPx}px)`);
    // Jarak ternormalisasi ke pusat ellipse (r>1 = di luar → alpha 0).
    const cx = side === 'right' ? vw : 0;
    const cy = w.atY * vh;
    const rAt = (x, y) => Math.sqrt(((x - cx) / w.rxPx) ** 2 + ((y - cy) / w.ryPx) ** 2);
    // Kanji soal (terukur x159-231, y278-350): DI LUAR ellipse → 0% tint.
    for (const [x, y] of [[159, 278], [231, 278], [159, 350], [231, 350]]) {
      const r = rAt(x, y);
      assert.ok(r >= 1, `${tech}: kanji (${x},${y}) r=${r.toFixed(3)} — wash menyentuh soal`);
    }
    // Kartu jawaban (y ≥ 414, x 16-374): jauh di luar ellipse.
    for (const [x, y] of [[16, 414], [374, 414], [195, 414], [195, 620]]) {
      const r = rAt(x, y);
      assert.ok(r > 1.4, `${tech}: opsi (${x},${y}) r=${r.toFixed(3)} — wash menyentuh jawaban`);
    }
    // Baris tombol kontrol atas (y16-48) harus hampir bersih dari wash.
    for (const [x, y] of [[340, 32], [260, 32], [180, 32], [100, 32]]) {
      const r = rAt(x, y);
      assert.ok(r >= 1, `${tech}: tombol atas (${x},${y}) kena wash (r=${r.toFixed(3)})`);
    }
    // Pojok bawah tombol EN/ID — hanya ekor sangat lembut (alpha ≤ ~10%).
    const [ex, ey] = side === 'right' ? [374, 48] : [16, 48];
    assert.ok(rAt(ex, ey) >= 0.95, `${tech}: ekor fade terlalu kuat di tombol (r=${rAt(ex, ey).toFixed(3)})`);
    // Bola sendiri harus berada di INTI terang wash (r ≤ 0.4 → alpha penuh).
    const [bx, by] = side === 'right' ? [358, 167] : [32, 167];
    assert.ok(rAt(bx, by) <= 0.4, `${tech}: bola di luar inti wash (r=${rAt(bx, by).toFixed(3)})`);
  }
});

test('gojoBallLabel: teks kanji makin greget (fontScale & stroke tebal)', () => {
  const ao = gojoBallLabel('ao');
  assert.ok(ao.fontScale >= 0.6, 'teks harus lebih besar');
  assert.ok(ao.strokeWidth >= 4, 'outline tinta harus tebal');
  assert.equal(typeof ao.glow, 'string');
});

// ── Layout bola responsif (fix HP: kartu jawaban ketutupan) ─────────────────
// Permintaan user: "di hp kan sempit tuh, tadi gw tes ketutupan si card
// jawabannya". Solusi: di layar sempit bola NAIK ke sudut atas + dikecilkan.

test('gojoBallLayout: desktop = tepi tengah, HP = sudut atas + lebih kecil', () => {
  const d = gojoBallLayout('ao', 1280, 800);
  assert.equal(d.mobile, false);
  assert.equal(d.size, 128);
  assert.equal(d.anchorYVh, 0, 'desktop: bola sejajar tengah');
  assert.ok(d.anchorXVw > 0, 'ao di kanan');

  const m = gojoBallLayout('ao', 390, 844);
  assert.equal(m.mobile, true);
  assert.ok(m.size < d.size, 'HP: bola lebih kecil');
  assert.ok(m.anchorYVh < 0, 'HP: bola naik ke ATAS');
  assert.ok(m.anchorXVw > 0, 'HP ao tetap di kanan');
  assert.equal(m.size, 44, 'HP: bola 44px (lebih kecil dari 84)');
  // bola tetap di dalam layar (tidak keluar tepi)
  const cx = 390 / 2 + (m.anchorXVw / 100) * 390;
  assert.ok(cx + m.size / 2 <= 390, 'bola tidak keluar tepi kanan');
  assert.ok(cx - m.size / 2 >= 0, 'bola tidak keluar tepi kiri');
  // bola ada di area ATAS layar (di atas kartu jawaban di tengah)
  const cy = 844 / 2 + (m.anchorYVh / 100) * 844;
  assert.ok(Math.abs((cy - m.size / 2) - 145) <= 1, 'HP: tepi atas bola ≈ y145 (di bawah border header)');
  assert.ok(cy + m.size / 2 < 844 * 0.35, 'bola harus di sepertiga atas layar');

  const aka = gojoBallLayout('aka', 390, 844);
  assert.ok(aka.anchorXVw < 0, 'HP aka di kiri');
  assert.ok(aka.anchorYVh < 0, 'HP aka juga naik');

  assert.equal(gojoBallLayout('murasaki', 390, 844), null);
  assert.equal(gojoBallLayout(null, 390, 844), null);
  assert.equal(GOJO_BALL_BREAKPOINT, 768);
});

test('gojoBallLayout: di HP bola tetap di atas progress bar & kartu jawaban', () => {
  // Terukur (360/375/390/430 × HP): border header berakhir y≈143,
  // progress bar kotoba/kanji y≈191–197, kartu soal y≈237.
  for (const [vw, vh] of [[390, 844], [360, 780], [430, 932]]) {
    for (const t of ['ao', 'aka']) {
      const L = gojoBallLayout(t, vw, vh);
      const cy = vh / 2 + (L.anchorYVh / 100) * vh;
      const bottom = cy + L.size / 2;
      assert.ok(bottom < 191, `${t} @${vw}x${vh}: bola menyentuh progress bar (bottom=${bottom.toFixed(0)})`);
      assert.ok(bottom < 237, `${t} @${vw}x${vh}: bola menutupi kartu soal`);
    }
  }
});

test('gojoBallLayout: di HP bola turun ke bawah header — tidak nempel tombol atas', () => {
  for (const [vw, vh] of [[390, 844], [360, 780], [430, 932]]) {
    const L = gojoBallLayout('ao', vw, vh);
    const cy = vh / 2 + (L.anchorYVh / 100) * vh;
    const top = cy - L.size / 2;
    assert.ok(top >= 143, `tepi atas di bawah border header (top=${top.toFixed(0)})`);
    assert.ok(L.size <= 48, `ukuran kecil (size=${L.size})`);
  }
});

test('gojoTensionLines: terima focus kustom (HP: memancar dari sudut atas)', () => {
  const lines = gojoTensionLines('ao', 1, () => 0.5, 24, { x: 80, y: 11 });
  assert.equal(lines.length, 24);
  for (const l of lines) {
    assert.ok(l.from[0] >= 50, 'ao tetap di sisi kanan');
    assert.ok(l.from[1] < 30, 'fokus di area atas');
  }
});

test('gojoTensionLines: maxY membatasi garis tetap di atas (tidak kena kartu)', () => {
  // HP: fokus di sudut atas + maxY 24 → semua titik y <= 24 (di atas kartu jawaban).
  const lines = gojoTensionLines('ao', 1, Math.random, 24, { x: 80, y: 11 }, 24);
  assert.equal(lines.length, 24);
  for (const l of lines) {
    assert.ok(l.from[1] <= 24 && l.to[1] <= 24, `y harus <= 24, dapat from=${l.from[1]} to=${l.to[1]}`);
  }
  // tanpa maxY → tidak dibatasi (bisa lebih dari 24)
  const free = gojoTensionLines('ao', 1, Math.random, 24, { x: 80, y: 50 });
  assert.ok(free.some((l) => l.to[1] > 24), 'tanpa maxY garis boleh turun');
});

// ── Aura bola: HP = halo lebih rapat & lebih terang ─────────────────────────
// Permintaan user: "kan kalo di laptop ada aura nya gitu, buat juga di tampilan
// hape, tapi cuma di lingkaran bola aja sedikit lebih besar dari bola".
// Masalah lama: di HP aura pakai parameter desktop (inset -size*0.55 + alpha
// redup) → di bola 44px + latar terang (vignette desktop tidak dirender di HP)
// aura nyaris tidak kelihatan. Solusi: di HP aura lebih RAPAT (sedikit lebih
// besar dari bola) + lebih TERANG supaya tetap terbaca. Desktop TIDAK berubah.

test('gojoBallAura: desktop tetap pakai aura lama (tidak berubah)', () => {
  const a = gojoBallAura('ao', 128, false);
  assert.ok(a, 'ao harus punya aura');
  assert.ok(Math.abs(a.inset - (-128 * 0.55)) < 0.01, 'desktop: inset -size*0.55 (lama)');
  assert.ok(a.background.includes('#00b0ff99'), 'desktop: inti alpha 99 (lama)');
  assert.ok(a.background.includes('#00b0ff22'), 'desktop: tail alpha 22 (lama)');
  assert.ok(a.background.includes('transparent 72%'), 'desktop: falloff 72% (lama)');
});

test('gojoBallAura: HP = halo sedikit lebih besar dari bola, lebih terang', () => {
  const size = 44;
  const m = gojoBallAura('ao', size, true);
  const d = gojoBallAura('ao', size, false);
  assert.ok(m, 'ao HP harus punya aura');
  // "sedikit lebih besar dari bola": aura rapat, tidak melebar jauh
  assert.ok(Math.abs(m.inset) >= size * 0.25, `aura tetap terlihat (inset=${m.inset})`);
  assert.ok(Math.abs(m.inset) <= size * 0.42, `aura tidak melebar jauh (inset=${m.inset})`);
  assert.ok(Math.abs(m.inset) < Math.abs(d.inset), 'HP lebih rapat dari desktop');
  // lebih terang: inti alpha tinggi, tail redup desktop dibuang
  assert.ok(m.background.includes('#00b0ffe6'), 'HP: inti lebih terang (alpha e6)');
  assert.ok(!m.background.includes('#00b0ff22'), 'HP: tidak pakai tail redup desktop');
  assert.ok(m.background.includes('transparent 72%'), 'HP: tetap memudar mulus');
});

test('gojoBallAura: aka = merah; teknik lain null', () => {
  const a = gojoBallAura('aka', 44, true);
  assert.ok(a && a.background.includes('#e53935'), 'aka = merah');
  assert.equal(gojoBallAura('murasaki', 44, true), null);
  assert.equal(gojoBallAura(null, 44, true), null);
});

// ── Ledakan 茈 (murasaki) — lebih TEBAL ─────────────────────────────────────
// Permintaan user: "efek meledak si murasaki nya kurang masih tipis, gw pengen
// lebih tebel". Ketebalan ledakan dikumpulkan di gojoMurasakiBurst() supaya
// bisa di-tune sekali + diuji. (Domain TIDAK ikut berubah.)

test('gojoMurasakiBurst: plasma core lebih tebal (inti solid besar + glow kuat)', () => {
  const b = gojoMurasakiBurst();
  assert.ok(b.core, 'ada parameter core');
  const white = /0 (\d+)%/.exec(b.core.background);
  assert.ok(white && Number(white[1]) >= 20, `inti putih >= 20% (lama 14), dapat ${white && white[1]}`);
  const glow = /0 0 (\d+)px (\d+)px/.exec(b.core.boxShadow);
  assert.ok(glow && Number(glow[1]) >= 80 && Number(glow[2]) >= 28,
    `glow core lebih besar dari 60/18, dapat ${b.core.boxShadow}`);
});

test('gojoMurasakiBurst: shockwave ring lebih tebal (border >= 9px, glow besar)', () => {
  const b = gojoMurasakiBurst();
  assert.ok(b.ring.borderWidth >= 9, `border >= 9px (lama 5), dapat ${b.ring.borderWidth}`);
  assert.ok(b.ring.border.includes(`${b.ring.borderWidth}px solid`), 'border string konsisten dgn borderWidth');
  const glow = /0 0 (\d+)px (\d+)px/.exec(b.ring.boxShadow);
  assert.ok(glow && Number(glow[2]) >= 14, `glow ring lebih besar dari 8px, dapat ${b.ring.boxShadow}`);
});

test('gojoMurasakiBurst: petir/bintang/集中線/serpihan lebih tebal', () => {
  const b = gojoMurasakiBurst();
  assert.ok(b.boltInk >= 5, `petir >= 5 (lama 3.5), dapat ${b.boltInk}`);
  assert.ok(b.boltRim >= 1.6, `rim petir (lama 1), dapat ${b.boltRim}`);
  assert.ok(b.starStroke >= 3.5, `bintang (lama 2.4), dapat ${b.starStroke}`);
  assert.ok(b.speedLineScale >= 1.8, `集中線 (lama 1x), dapat ${b.speedLineScale}`);
  assert.ok(b.particleScale >= 1.4, `serpihan (lama 1x), dapat ${b.particleScale}`);
});

test('gojoMurasakiBurst: durasi ledakan diselaraskan klip suara (tidak kecepetan)', () => {
  const b = gojoMurasakiBurst();
  // Ledakan utama (core+ring) harus berlangsung beberapa detik, bukan 1.5s —
  // keluhan user: "suara sama efek murasaki gak match, efek kecepetan".
  assert.ok(b.coreDur >= 1.8, `coreDur harus >= 1.8s, dapat ${b.coreDur}`);
  assert.ok(b.ringDur >= 2.0, `ringDur harus >= 2.0s, dapat ${b.ringDur}`);
  // Bola tabrakan dulu (d0 = 0.42s) lalu ledakan — total tetap <= klip suara.
  assert.ok(0.42 + b.ringDur <= 3.24, 'ledakan tidak melebihi durasi klip suara');
  assert.ok(b.ringDur > b.coreDur, 'shockwave = ekor ledakan, lebih panjang dari inti');
});

test('gojoMurasakiBurst: deterministik & warna = warna kanon murasaki', () => {
  assert.deepEqual(gojoMurasakiBurst(), gojoMurasakiBurst());
  const b = gojoMurasakiBurst();
  assert.ok(b.core.background.includes(GOJO_STYLE.murasaki.color), 'core pakai warna murasaki');
  assert.ok(b.ring.border.includes(GOJO_STYLE.murasaki.color), 'ring pakai warna murasaki');
});
