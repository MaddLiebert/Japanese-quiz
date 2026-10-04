// ─────────────────────────────────────────────────────────────────────────────
// EdoNightFestival — 夜市 yomise: MALAM FESTIVAL yang RAMAI (bukan "biru kosong").
//
// Kritik user: "malem gak kerasa kaya festival, gak ramai, birunya generik,
// gak ada elemen2 festival, masih kosong." Maka lapisan ini MENGHADIRKAN
// keramaian malam Edo:
//   • 提灯 chochin — deretan lentera gantung bertali, tiap lentera ber-kanji
//     (酒/寿司/祭/茶/そば/天), glow hangat, berayun lembut (angin malam).
//   • 花火 hanabi — kembang api warna (朱/金/藍), mekar bergantian.
//   • asap/warung — kabut hangat dari stan.
//
// DIHAPUS (kritik user: "latar belakang yang gepeng ... jelek"): 屋台 yatai
// (tenda stan) & 人々 kerumunan siluet. Keduanya digambar dengan
// preserveAspectRatio="none" pada viewBox persegi 100×100 yang ditarik selebar
// layar → melar ~7× jadi pipih ("gepeng"). Lentera 提灯 & kembang api 花火 tetap
// (keduanya proporsional, bukan stretch).
//
// HANYA tampil saat malam 夜市 (di-gate CSS: .dark[data-era="edo"]).
// Dekoratif → pointer-events:none + aria-hidden. Animasi via CSS (compositor).
// ─────────────────────────────────────────────────────────────────────────────

// Lentera gantung: posisi x (%), tinggi tali, kanji, jeda ayun.
const CHOCHIN = [
  { x: 7,  rope: 8,  kanji: '酒',  delay: 0.0 },
  { x: 21, rope: 13, kanji: '寿司', delay: 0.6 },
  { x: 36, rope: 7,  kanji: '祭',  delay: 0.3 },
  { x: 52, rope: 12, kanji: '茶',  delay: 0.9 },
  { x: 68, rope: 8,  kanji: 'そば', delay: 0.2 },
  { x: 83, rope: 14, kanji: '天',  delay: 0.7 },
  { x: 94, rope: 10, kanji: '菓子', delay: 0.4 },
];

export function EdoNightFestival() {
  return (
    <div className="edo-night-festival" aria-hidden="true">
      {/* Kabut hangat dari stan (dasar) */}
      <div className="edo-fest-haze" />

      {/* 提灯 chochin — deretan lentera gantung (ramai & hangat) */}
      <div className="edo-chochin-row">
        {CHOCHIN.map((c, i) => (
          <div key={i} className="edo-chochin" style={{ left: `${c.x}%`, top: 0, animationDelay: `${c.delay}s` }}>
            <div className="edo-chochin-rope" style={{ height: `${c.rope}vh` }} />
            <div className="edo-chochin-body">
              <span className="edo-chochin-kanji">{c.kanji}</span>
            </div>
            <div className="edo-chochin-glow" />
          </div>
        ))}
      </div>

      {/* 花火 hanabi — kembang api warna mekar bergantian */}
      <div className="edo-hanabi-row">
        <span className="edo-hanabi2" style={{ left: '14%', top: '14%', animationDelay: '0s',   '--hb': 'var(--edk-shu)' }} />
        <span className="edo-hanabi2" style={{ left: '72%', top: '10%', animationDelay: '2.4s', '--hb': 'var(--edk-kin)' }} />
        <span className="edo-hanabi2" style={{ left: '46%', top: '6%',  animationDelay: '4.8s', '--hb': 'var(--edk-ai)' }} />
        <span className="edo-hanabi2" style={{ left: '88%', top: '26%', animationDelay: '6.6s', '--hb': 'var(--edk-shu)' }} />
      </div>
    </div>
  );
}

export default EdoNightFestival;
