# Plan — Gojo Bola Persist (konsep user)

## Konsep (dari user, verbatim)
> "pas gw mencet bener ao nih, nah jangan meledak kek gitu, tapi stay muter di pinggir,
>  kalo bisa animasi ao masih ada pas aka, nah si aka juga sama kaya ao muter gitu di kiri,
>  ketika bener 3 nih, ao sama aka ke tengah meledak"

Keputusan clarify:
- Setelah meledak (#3) → **RESET**: bola hilang semua, #4 mulai kosong (ao muncul lagi).
- ao/aka (#1,#2): **HILANGKAN** elemen anime lain (impact star, partikel, オノマトペ,
  retak, flash, petir, 集中線) — cuma bola muter tenang di pinggir.
- Tiap murasaki (3, 5, 10, 20, …) → **konsisten meledak**.

## Masalah arsitektur
Sekarang bola dirender DI DALAM `GojoBurst`, yang di-mount/unmount per jawaban
(`key={gojo-${fx.id}}`, hilang saat `fx` null). Jadi bola tidak bisa "nempel"
antar jawaban. → Bola harus pindah ke komponen sendiri, dikontrol state persisten
di `EffectProvider`.

## Aturan state bola (akumulasi sejak ledakan terakhir)
| Jawaban | Teknik | State bola |
|---|---|---|
| benar #1 | ao | `{ ao: true }` — biru muncul kanan |
| benar #2 | aka | `{ ao: true, aka: true }` — merah muncul kiri, ao TETAP |
| benar #3 | murasaki | PAKSA `{ ao:true, aka:true }` → **explode** (ke tengah, meledak) → reset |
| benar #4 | ao | `{ ao: true }` — mulai lagi |
| salah / domain | null/domain | reset (tanpa bola) |

Murasaki **memaksa** kedua bola ada (kanon 茈 = 蒼 + 赫) walau baru 1 yang muncul.

## File
- `gojoFx.js` — `nextGojoBalls(current, technique, explodeId)` + `GOJO_BALLS_EMPTY` (pure, dites)
- `GojoSpheres.jsx` — **BARU**: render bola persist (pindah dari GojoBurst), muter terus;
  saat explode → meluncur ke tengah lalu meledak.
- `GojoBurst.jsx` — buang blok bola; mode `minimal` untuk ao/aka (hanya teks kanji kalem);
  murasaki: ledakan di-delay `d0≈0.4s` agar sinkron bola tiba di tengah.
- `EffectContext.jsx` — state `gojoBalls` + wiring di `triggerEffect` + render `<GojoSpheres>`.
- `gojoFx.test.js` — test `nextGojoBalls`.

## Fase
1. RED: test `nextGojoBalls` (akumulasi, murasaki paksa 2, reset).
2. GREEN: implement `nextGojoBalls`.
3. `GojoSpheres.jsx` + buang bola dari `GojoBurst` + mode minimal ao/aka.
4. Wiring `EffectContext.jsx` (state + reset terjadwal yang aman).
5. Verifikasi browser: ao nempel → aka muncul (ao masih ada) → #3 tabrakan+ledak → reset.
6. Gate: test + lint + build; commit per fase (JANGAN push).
