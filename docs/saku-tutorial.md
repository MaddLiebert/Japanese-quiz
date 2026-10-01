# Tutorial 指南 — Teks Saku chann

> **Status:** ✅ terimplementasi (tombol mengapung + panel balon teks).
> **Sumber tunggal teks:** `src/features/tutorial/tutorials.js` — kalau mau ubah
> kata-kata Saku, edit di situ. Doc ini cuma ringkasan biar gampang dibaca.

## Konsep

Bukan tur otomatis ("Step 1/8" yang muncul sendiri = nyebelin). Ini **tombol kecil
"Tutorial"** di pojok kanan-bawah; user klik **pas dia butuh**. Isi panel =
**tips halaman yang lagi dibuka** (context-aware), bukan daftar panjang semua topik.

Alasan pilih teks, bukan suara:
- **Gak semua orang tahan denger audio** (di tempat umum, atau cuma ngerasa cringe).
- Teks **bisa dibaca kapan aja, diem-diem**, gak maksa siapa pun.
- **Murah & gampang diubah** — nol file mp3, nol risiko gagal senyap.

Saku tetap hadir: **avatar 咲 + balon teks**, bukan suara.

## Cara kerja

| Bagian | Detail |
|---|---|
| Tombol | Mengapung kanan-bawah, ikon 咲 + label "Tutorial". Ada **badge angka** = jumlah topik yang belum dibaca. |
| Panel | Balon teks Saku: judul topik + beberapa baris tips + tanda tangan. |
| Context-aware | Buka di `/speaking` → tampil tips Bicara; di `/n5-exam` → tips Ujian. |
| Tandai terbaca | Begitu panel dibuka, topik itu ditandai `tutorialSeen` (badge turun). |
| Tutup | Tombol ✕ atau **Escape**. |
| Reset | Ikut `resetProgress` di Pengaturan (mulai dari nol lagi). |

## 13 topik (1 per halaman)

| Halaman | Judul |
|---|---|
| `/` | 🏠 Mulai dari Mana? |
| `/learn` | 📖 Belajar Huruf & Kata |
| `/practice` | ✏️ Kuis Latihan |
| `/writing` | 🖌️ Latihan Menulis |
| `/speaking` | 🎤 Latihan Bicara |
| `/mondai` | 🎧 Mondai (Listening) |
| `/review` | 🔁 Ulang Soal Lemah |
| `/shop` | 🏪 Warung & Gacha |
| `/inventory` | 🎒 Tas Punggung |
| `/death-quiz` | 💀 Death Quiz 死闘 |
| `/n5-exam` | 📜 Ujian N5 模擬試験 |
| `/settings` | ⚙️ Pengaturan |
| `/profile` | 👺 Profil & Cap |

Teks lengkap (ID + EN) ada di `tutorials.js`, field `lines[]`.

## Aturan penulisan teks Saku

Ikut [[Kepribadian Saku]]:
- Bahasa Indonesia santai, kata ganti **"aku"**, sapa **"kamu"**.
- **Terjemahkan istilah teknis → manfaat awam.** Jangan "endpoint", tulis "tombol".
- **1–3 baris per topik**, jangan bikin scroll panjang di HP.
- Sebut hal yang **beneran ada** (tombol "PAKAI", refund "50 medaru", lulus "80").
- Nada: hangat, ramah, sedikit norak-gemes, tapi **jujur**.

## Kenapa bukan suara (keputusan)

Voice pack Saku **belum dibuat** dan **ditunda** — model teks+tombol dipilih user
karena lebih inklusif & gampang diubah. Kalau nanti mau ditambah suara: tinggal
render mp3 dari `tutorials.js` (per klip), taruh di `public/voices/saku/`, daftarkan
di `src/features/audio/voices.js`. **Tidak perlu refactor** — teksnya sudah terpisah
di modul murni.
