# Plan: Terjemahan Puitis Indonesia Puisi + Section "Puisi" di Learn (baca lengkap + kredit penulis)

**Tanggal**: 2026-09-26
**Repo**: `C:\Users\maddo\Documents\japanese-quiz` (React 19 + Vite + Tailwind v4 + React Router v7 + Motion)
**Bahasa kerja**: kode & komentar mengikuti konvensi repo (komentar Indonesia, UI bilingual en/id).

---

## Goal

Tambahkan **terjemahan puitis Indonesia per baris** untuk 19 puisi di fitur Speaking → tab Puisi, dan tambahkan **section baru "Puisi" di halaman Learn** sebagai rumah baca puisi: puisi lengkap + furigana + terjemahan + audio + **kredit penulis (siapa yang menulis puisi itu)**.

**Keputusan user (revisi 27/09/2026)**:

1. Section baru bernama **"Puisi"** di halaman Learn — di situ puisi lengkapnya dibaca (teks + terjemahan + kredit).
2. Tab Puisi di Speaking **tetap apa adanya** (latihan mic + XP) — tidak dihapus, tidak diubah.
3. **Kredit penulis WAJIB** tampil di section Learn: nama penyair (kanji + bacaan kana + romaji), tahun hidup, dan sumber (link Aozora untuk 12 puisi bertema; "karya klasik · domain publik" untuk 7 puisi klasik).
4. **Terjemahan di Speaking default OFF di level "Buta"** (arti sudah jadi petunjuk); ON di level Pandu & Ingat — toggle tetap bisa dinyalakan manual. (Keputusan user, 27/09.)

---

## Current Context / Assumptions

Baca ini dulu — kamu tidak tahu apa-apa soal repo ini.

- **Struktur relevan**:
  - `src/data/poems.json` — 19 puisi. Setiap puisi: `{ id, title, titleReading, author, authorReading, type, excerpt, meaning, meaning_id, lines[], theme?, source? }`. Setiap `line` = `{ segments: [{ t, r? }] }` (`t` = teks Jepang, `r` = furigana kana). `meaning_id` = ringkasan 1 kalimat (BUKAN terjemahan bait-per-bait).
  - `src/features/speaking/speaking.js` — modul MURNI (tanpa React/DOM/import JSON). Sudah mengekspor `lineText`, `lineReading`, `POEM_THEMES`, `filterPoemsByTheme`. **Pola repo: logika murni di `*.js`, diuji dengan `node --test`.**
  - `src/features/speaking/PoemSession.jsx` — sesi latihan bicara puisi (baris per baris, tombol Dengar + Mic, toggle ふりがな). Ini yang diubah untuk menampilkan terjemahan.
  - `src/features/speaking/Furigana.jsx` — render `<ruby>` dari `segments`.
  - `src/pages/Learn.jsx` — halaman "Belajar". Tab atas pakai `<KanaTypeToggle>`. Alur: pilih kategori (list) → kartu flashcard. **Belum ada puisi di sini.**
  - `src/components/KanaTypeToggle.jsx` — bar tab bersama; dipakai Learn (baris 99) DAN Practice (baris 670). **Jangan rusak Practice.**
  - `src/context/LanguageContext.jsx` — `useLanguage()` → `{ language: 'en' | 'id' }`. `const id = language === 'id'`.
  - `src/utils/audio.js` — `playDramaticAudio(text)` untuk memutar TTS Jepang.
- **Konvensi penting**:
  - Tes: `npm test` = `node --test` (menemukan `**/*.test.js`). Hanya modul murni yang diuji (tidak ada jsdom). JANGAN menulis tes React/DOM.
  - Baseline tes saat ini: **184 pass, 0 fail** (target akhir 192 = +4 poemTranslation +4 poemCredits). Lint (`npm run lint`) sudah punya warning lama — abaikan; jangan menambah error baru.
  - Data puisi **jangan** ditaruh di `poems.json`: `scripts/import-aozora-poems.mjs` me-regenerate 12 puisi bertema dari `POEM_META` saat dijalankan ulang → field tambahan hilang. Karena itu terjemahan disimpan di file terpisah.
- **Asumsi**: hanya terjemahan **Indonesia** yang diminta (tidak perlu versi Inggris per baris). Terjemahan ditampilkan di UI apa pun bahasanya, dengan label jelas.
- **Asumsi kredit**: kredit penulis memakai data yang sudah ada (`author`, `authorReading`, `source`) + tabel `POET_META` baru untuk romaji/tahun hidup; tidak perlu field baru di `poems.json` (importer akan menghapusnya).

---

## Architecture / Proposed Approach

Terjemahan puitis disimpan di file data baru `src/data/poem-translations.json` (key = `poem.id`, value = `{ title_id, lines_id[] }` dengan `lines_id[i]` sejajar index `poem.lines[i]`). Logika akses ditaruh di modul murni baru `src/features/speaking/poemTranslation.js` (diuji TDD). `PoemSession.jsx` menampilkan terjemahan per baris dengan toggle; `src/pages/Learn.jsx` mendapat section baru "Puisi" yang merender komponen baca-saja baru `src/features/learn/PoemReader.jsx`, memakai ulang `Furigana`, `POEM_THEMES`, `filterPoemsByTheme`, dan helper terjemahan baru (DRY — tidak menduplikasi logika filter/segmen). Kredit penulis ditangani modul murni baru `src/features/speaking/poemCredits.js` (`POET_META` = romaji + tahun hidup per penyair; helper `poemCredit`/`creditLine`, diuji TDD); tampil sebagai blok kredit di halaman puisi + baris ringkas di kartu daftar.

---

## Standar Kualitas Terjemahan (WAJIB dibaca implementer)

Terjemahan ini **bukan** terjemahan harfiah. Aturan:

1. **Sejajar baris**: `lines_id` harus punya jumlah elemen **persis sama** dengan `poem.lines`, dan `lines_id[i]` menerjemahkan `poem.lines[i]` (bukan digabung/dipindah).
2. **Diksi puitis, bukan kamus**: terjemahkan citra/rasa, bukan kata-per-kata. Gunakan kata konkret + kata kerja aktif.
3. **Pertahankan tanda jeda** haiku/tanka (`や`, `かな`, `——`, `……`) sebagai `—`, `……`, koma, atau baris terpisah — jangan dihapus.
4. **Register sesuai zaman**: haiku/tanka klasik → padat, arkais secukupnya. Free verse awal abad 20 (Shimazaki/Nakahara/Takamura) → lirik, jangan slang modern.
5. **Refrein & indentasi**: baris yang dimulai `　　` (spasi ideografik) di sumber → terjemahan diawali `　　` juga (lihat 春はきぬ).
6. **Jangan menambah penjelasan/tafsir** — pembaca ingin puisi, bukan catatan kaki.
7. `title_id` = judul puitis singkat (bukan transliterasi).

Contoh BURUK vs BAIK (untuk kalibrasi rasa):

| Sumber | ❌ Harfiah (jangan) | ✅ Puitis (pakai ini) |
|---|---|---|
| 古池や | "Kolam tua" | "Kolam purba —" |
| 蛙飛びこむ | "Katak melompat masuk" | "katak melompat ke dalam," |
| 水の音 | "Suara air" | "desah air." |
| 名月を | "Bulan terang" | "Bulan purnama —" |
| 兵どもが / 夢の跡 | "Prajurit / jejak mimpi" | "para kesatria," / "jejak mimpi belaka." |

---

## Standar Kredit Penulis (WAJIB — keputusan user 27/09)

Setiap puisi di section Learn wajib menampilkan **siapa penulisnya**. Data yang tampil:

| Bagian | Contoh | Sumber |
|---|---|---|
| Nama penyair + bacaan kana | 松尾芭蕉（まつおばしょう） | `poems.json` (`author`, `authorReading`) |
| Nama romaji | Matsuo Bashō | `POET_META` (`poemCredits.js`) |
| Tahun hidup | 1644–1694 | `POET_META` |
| Sumber | link "Aozora Bunko 青空文庫" | `poems.json` (`source`) — hanya 12 puisi bertema |
| Puisi klasik tanpa source | "Karya klasik · domain publik" | fallback di `poemCredit()` |

`POET_META` — 9 penyair, kunci = `author` persis seperti `poems.json` (sumber: Wikipedia/Wikidata; jangan mengarang — guard test menolak penyair yang belum terdaftar):

| author | romaji | dates |
|---|---|---|
| 松尾芭蕉 | Matsuo Bashō | 1644–1694 |
| 小林一茶 | Kobayashi Issa | 1763–1828 |
| 与謝蕪村 | Yosa Buson | 1716–1784 |
| 小野小町 | Ono no Komachi | c. 825 – c. 900 |
| 宮沢賢治 | Miyazawa Kenji | 1896–1933 |
| 正岡子規 | Masaoka Shiki | 1867–1902 |
| 島崎藤村 | Shimazaki Tōson | 1872–1943 |
| 中原中也 | Nakahara Chūya | 1907–1937 |
| 高村光太郎 | Takamura Kōtarō | 1883–1956 |

---

## Step-by-step Tasks

Kerjakan berurutan. Commit di akhir setiap task. Pesan commit pakai Conventional Commits (`feat(speaking): ...`, `feat(learn): ...`).

### Task 0 — Siapkan data terjemahan (data saja, belum ada UI)

**File baru**: `src/data/poem-translations.json`

Tulis **tepat** isi berikut (19 puisi; jangan ubah key `poem.id`):

```json
{
  "poem_basho_furuike": {
    "title_id": "Kolam Purba",
    "lines_id": [
      "Kolam purba —",
      "katak melompat ke dalam,",
      "desah air."
    ]
  },
  "poem_basho_natsukusa": {
    "title_id": "Rumput Musim Panas",
    "lines_id": [
      "Rumput musim panas —",
      "para kesatria,",
      "jejak mimpi belaka."
    ]
  },
  "poem_issa_meigetsu": {
    "title_id": "Bulan Purnama",
    "lines_id": [
      "Bulan purnama —",
      "“ambilkan untukku,”",
      "si kecil menangis."
    ]
  },
  "poem_buson_nanohana": {
    "title_id": "Bunga Kanola",
    "lines_id": [
      "Bunga kanola —",
      "bulan di timur,",
      "matahari di barat."
    ]
  },
  "poem_komachi_hananoiro": {
    "title_id": "Warna Bunga",
    "lines_id": [
      "Warna bunga pun",
      "telah lama memudar",
      "tanpa guna",
      "aku menua di dunia",
      "termenung dalam hujan panjang."
    ]
  },
  "poem_kenji_amenimomakezu": {
    "title_id": "Tak Kalah oleh Hujan",
    "lines_id": [
      "Tak kalah oleh hujan",
      "tak kalah oleh angin",
      "tak kalah oleh salju maupun terik musim panas",
      "berbadan tegap dan sehat",
      "tanpa ketamakan",
      "tak pernah marah",
      "selalu tersenyum dalam sunyi",
      "sehari empat cangkir beras merah",
      "dengan miso dan sedikit sayur, kumakan",
      "segala sesuatu",
      "tanpa kuhitung diriku sendiri",
      "kudengar, kusimak, kupahami",
      "dan tak kulupakan",
      "di bawah rindang pepohonan pinus di padang",
      "kuhuni gubuk beratap alang-alang kecil",
      "bila di timur ada anak sakit",
      "kupergi merawatnya",
      "bila di barat ada ibu yang lelah",
      "kupergi memikul berkas padinya",
      "bila di selatan ada orang sekarat",
      "kupergi dan berkata, “jangan takut”",
      "bila di utara ada pertengkaran dan perkara",
      "kukata, “tak guna, hentikanlah”",
      "saat kekeringan, kutitikkan air mata",
      "saat musim panas dingin, kuharu-biru berjalan",
      "dipanggil bodoh oleh semua orang",
      "tak dipuji",
      "tak pula dianggap beban",
      "orang seperti itulah",
      "yang ingin kujadi"
    ]
  },
  "poem_basho_yamaji": {
    "title_id": "Di Jalan Pegunungan",
    "lines_id": [
      "Menyusuri jalan pegunungan —",
      "entah mengapa mempesona,",
      "bunga violet di rumput."
    ]
  },
  "poem_shiki_kakikueba": {
    "title_id": "Saat Menyantap Kesemek",
    "lines_id": [
      "Menyantap kesemek —",
      "gemerincing lonceng pun berbunyi,",
      "di Hōryū-ji."
    ]
  },
  "poem_shimazaki_hatsukoi": {
    "title_id": "Cinta Pertama",
    "lines_id": [
      "Rambut depan yang baru mulai diangkat,",
      "ketika kulihat engkau di bawah pohon apel,",
      "dengan sisir bunga tersemat di depan,",
      "kukira engkaulah gadis yang berbunga itu.",
      "Dengan lembut kauulurkan tanganmu yang putih,",
      "dan yang menyerahkan apel kepadaku,",
      "pada buah musim gugur berwarna merah muda,",
      "itulah awal cinta pertamaku.",
      "Desah napasku yang hampa,",
      "ketika menyentuh helai rambutmu,",
      "cawan cinta yang membahagiakan",
      "kutuang atas kemurahan hatimu.",
      "Di bawah pepohonan kebun apel,",
      "jalan kecil yang terbentuk sendiri,",
      "“siapa gerangan yang pertama melangkahinya,”",
      "itulah pertanyaanmu yang kucintai."
    ]
  },
  "poem_shimazaki_kamiwoaraeba": {
    "title_id": "Ketika Kubasuh Rambutku",
    "lines_id": [
      "Ketika kubasuh rambutku, ungu",
      "tampak warnanya di depan rumput kecil,",
      "ketika kuangkat kaki, burung dan bunga",
      "mengikutiku dengan segala pesonanya.",
      "Ketika kupandang, awan berwarna",
      "terbentang dan terbuka bagai gulungan lukisan.",
      "Sake di tanganku adalah sake termanis,",
      "membalut kesedihan masa mudaku.",
      "Ketika kudengar, dewa nyanyian",
      "datang meniup seruling permata;",
      "ketika kubuka mulutku, satu bait",
      "seorang penyair — aku menyanyikan cinta.",
      "Ah, hingga sekian pun masih gaib,",
      "meski aku berhati membara;",
      "aku merinduimu,",
      "namun takkan menyamai air matamu."
    ]
  },
  "poem_shimazaki_haruhakinu": {
    "title_id": "Musim Semi Telah Tiba",
    "lines_id": [
      "Musim semi telah tiba",
      "　　musim semi telah tiba",
      "O nyanyian pertama burung perenjak yang lembut",
      "kabarkanlah perpisahan kepada tahun silam",
      "O salju putih yang tersisa di lembah",
      "kubur dan sembunyikanlah musim dingin tahun lalu",
      "Musim semi telah tiba",
      "　　musim semi telah tiba",
      "sepi, dingin, tanpa kata",
      "miskin, gelap, tanpa cahaya",
      "buruk, berat, tanpa daya",
      "O musim dingin yang sendu, pergilah",
      "Musim semi telah tiba",
      "　　musim semi telah tiba",
      "O rumput baru yang hijau pucat",
      "lukislah padang yang jauh",
      "O bunga musim semi yang merah merekah",
      "warnailah pucuk pepohonan",
      "Musim semi telah tiba",
      "　　musim semi telah tiba",
      "O kabut, O awan, bergeraklah",
      "hangatkan langit yang membeku",
      "O angin musim semi yang mengantar wangi bunga",
      "tiuplah, bangunkan gunung yang tertidur",
      "Musim semi telah tiba",
      "　　musim semi telah tiba",
      "O pasang pagi yang mendorong musim semi",
      "basuh dan hanyutkan daun alang-alang yang kering",
      "O bangau muda yang mabuk kabut",
      "terbanglah ke langit pagi yang muda",
      "Musim semi telah tiba",
      "　　musim semi telah tiba",
      "memutus akar seledri kesedihan",
      "air mata yang membeku, kini di mana",
      "salju yang menumpuk mencair lenyap",
      "bertunaslah sebagai sayur muda hari ini"
    ]
  },
  "poem_nakahara_yogore": {
    "title_id": "Pada Kesedihan yang Kian Kotor",
    "lines_id": [
      "Pada kesedihan yang kian kotor",
      "hari ini pun salju tipis berjatuhan",
      "Pada kesedihan yang kian kotor",
      "hari ini pun angin sekadar melintas",
      "Kesedihan yang kian kotor",
      "bagai bulu rubah yang kusut",
      "Kesedihan yang kian kotor",
      "ditempeli salju tipis, menggigil meringkuk",
      "Kesedihan yang kian kotor",
      "tak menginginkan apa pun, tak berharap apa pun",
      "Kesedihan yang kian kotor",
      "memimpikan mati dalam kejenuhan",
      "Pada kesedihan yang kian kotor",
      "dengan pedih, ia pun gentar",
      "Pada kesedihan yang kian kotor",
      "tanpa hasil apa pun, hari pun senja……"
    ]
  },
  "poem_nakahara_rinju": {
    "title_id": "Saat Ajal",
    "lines_id": [
      "Langit musim gugur berwarna kelabu pudar",
      "kilau mata kuda hitam",
      "　　air mengering, lily pun berguguran",
      "　　ah, alangkah hampa hati ini",
      "tanpa tuhan, tanpa penuntun",
      "dekat jendela perempuan itu berpulang",
      "　　langit putih membelalak buta",
      "　　angin putih terasa dingin",
      "di tepi jendela membasuh rambut",
      "lengannya begitu lembut",
      "　　matahari pagi pun tumpah",
      "　　bunyi air menetes",
      "kota-kota pun bersenandung",
      "suara anak-anak pun berselilit",
      "　　meski begitu, bagaimana jadinya jiwa ini?",
      "　　memudar tipis, menjadi langitkah?"
    ]
  },
  "poem_nakahara_harunohinoyugure": {
    "title_id": "Senja Musim Semi",
    "lines_id": [
      "Timah menyantap kerupuk senbei",
      "senja musim semi begitu tenang",
      "abu yang dilempar dari bawah memucat",
      "senja musim semi begitu sunyi",
      "Ah! adakah orang-orangan sawah — tak ada",
      "kudakah yang meringkik — takkan meringkik",
      "hanya cahaya bulan yang licin berkilau",
      "yang patuh itu — senja musim semi",
      "menetes-netes, di tengah padang candi memerah",
      "roda pedati kehilangan minyaknya",
      "ketika aku bicara dalam kala kini sejarah",
      "mengejek, mengejek, langit dan gunung",
      "sebuah genting pun terlepas",
      "sejak kini senja musim semi",
      "tanpa kata, terus maju",
      "ke dalam pembuluh nadinya sendiri"
    ]
  },
  "poem_nakahara_kofuku": {
    "title_id": "Kebahagiaan",
    "lines_id": [
      "Kebahagiaan ada di dalam kandang",
      "di atas jerami.",
      "Kebahagiaan",
      "bagi hati yang tenang, seketika terpahami.",
      "Hati yang keras kepala, malang dan gelisah,",
      "　　setidaknya dengan hal-hal yang memusingkan",
      "　　melipur diri pada segudang perkara.",
      "　　dan makin malanglah ia.",
      "Kebahagiaan itu beristirahat",
      "dan apa yang jelas harus dikerjakan",
      "sedikit demi sedikit dipangkunya,",
      "kebahagiaan kaya akan pengertian.",
      "　　Hati yang keras kepala, miskin pengertian,",
      "　　tak tahu apa yang harus dibuat, hanya mengejar untung,",
      "　　patah semangat, mudah marah,",
      "　　dibenci orang, dan sendiri pun bersedih.",
      "Maka, hai manusia, selalu belajarlah dahulu untuk menurut.",
      "Bukan agar diterima karena menurut,",
      "melainkan agar menurut itu sendiri menjadi pelajaran, dan dengan belajar",
      "martabatmu terangkat, dan pekerjaanmu menjadi berlimpah!"
    ]
  },
  "poem_takamura_jukanofutari": {
    "title_id": "Dua Orang di Bawah Pohon",
    "lines_id": [
      "——di dataran Adatara Michinoku, di pangkal akar dua batang pinus, tampak seseorang berdiri——",
      "itulah Gunung Adatara,",
      "yang berkilau itu Sungai Abukuma.",
      "duduk begitu, dengan sedikit kata,",
      "di dalam kepala yang mengantuk bagai tertidur,",
      "hanya angin pinus dari dunia jauh yang bertiup melintas, hijau pucat.",
      "Di tengah padang dan gunung awal musim dingin yang luas ini,",
      "sukacita kau dan aku yang diam-diam membara sambil bergandengan tangan,",
      "marilah berhenti menyembunyikannya dari awan putih yang menunduk itu.",
      "Kau mendidihkan ramuan ajaib dalam kendi jiwamu,",
      "ah, betapa kau menggoda orang ke dasar laut cinta yang gaib,",
      "panorama sepuluh musim yang kita jalani bersama,",
      "hanya memperlihatkan ketakterhinggaan perempuan di dalam dirimu.",
      "Yang berasap di batas ketakterhinggaan itu,",
      "menyucikan aku yang begitu digelisahkan perasaan,",
      "menuangkan mata air kemudaan yang segar ke dalam diriku yang sarat kepahitan,",
      "justru seperti iblis, sulit digenggam",
      "sesuatu yang aneh berubah wujud.",
      "itulah Gunung Adatara,",
      "yang berkilau itu Sungai Abukuma.",
      "di sinilah kampung kelahiranmu,",
      "titik-titik kecil berdinding putih itu adalah gudang sake keluargamu.",
      "Maka, bentangkanlah kakimu dengan leluasa,",
      "mari hirup udara yang lapang dan cerah ini, penuh wangi kayu negeri utara.",
      "udara sejuk dan menyenangkan seperti dirimu sendiri ini,",
      "mari basuh kulit kita dalam suasana yang lentur dan kenyal.",
      "Besok aku kembali pergi jauh,",
      "ke kota tanpa aturan itu, ke pusaran cinta dan benci yang kacau,",
      "ke tengah-tengah komedi manusia yang kutakuti namun kucintai itu.",
      "di sinilah kampung kelahiranmu,",
      "langit dan bumi yang melahirkan tubuh tersendiri yang ajaib ini.",
      "angin pinus masih bertiup,",
      "tolong sekali lagi ceritakan geografi panorama awal musim dingin yang sepi ini.",
      "itulah Gunung Adatara,",
      "yang berkilau itu Sungai Abukuma."
    ]
  },
  "poem_takamura_dandan": {
    "title_id": "Kau Makin Lama Makin Indah",
    "lines_id": [
      "Ketika perempuan satu demi satu membuang segala perhiasannya",
      "mengapa ia jadi begitu indah?",
      "Tubuhmu yang dibasuh oleh tahun-tahun",
      "adalah logam langit yang terbang melintasi ketakterhinggaan.",
      "penampilan dan nama baik sama sekali tak berguna",
      "makhluk bening yang hanya berisi hakikat",
      "hidup, bergerak, dan bersemangat dengan tangkas.",
      "bahwa perempuan merebut kembali keperempuannya",
      "adakah karena laku zaman ini?",
      "Ketika kau berdiri dalam diam",
      "sungguh ia buatan tuhan.",
      "kadang hingga membuat batinku takjub",
      "kau makin lama makin indah."
    ]
  },
  "poem_takamura_lemonaika": {
    "title_id": "Elegi Lemon",
    "lines_id": [
      "Kau begitu lama menanti sebiji lemon",
      "di ranjang kematian yang sendu, putih, dan terang",
      "sebiji lemon yang kuambil dari tanganku",
      "gigimu yang indah menggigitnya dengan kriuk",
      "wangi keemasan topas pun terbit",
      "beberapa tetes sari lemon dari langit itu",
      "seketika memulihkan kesadaranmu",
      "matamu yang biru bening tersenyum tipis",
      "O sehatnya kekuatan tanganmu yang menggenggam tanganku",
      "meski ada badai di tenggorokanmu",
      "di selat kehidupan yang seperti ini",
      "Chieko kembali menjadi Chieko yang dahulu",
      "menuang cinta seumur hidup dalam sekejap",
      "lalu sesaat",
      "menarik satu napas panjang bagai di puncak gunung dahulu",
      "mesin tubuhmu pun berhenti begitu saja",
      "di bawah bayang bunga sakura yang tersemat di depan fotomu",
      "hari ini pun kutaruh sebiji lemon yang sejuk berkilau."
    ]
  },
  "poem_takamura_doutei": {
    "title_id": "Perjalanan",
    "lines_id": [
      "Ah",
      "perjalanan umat manusia itu jauh",
      "dan tak ada jalan raya itu",
      "anak-anak alam harus membukanya dengan segenap tenaga tubuh",
      "Berjalanlah, berjalanlah",
      "apa pun yang muncul, lewati dan teruslah berjalan",
      "melangkahlah ke dalam pemandangan yang gemerlap ini",
      "Tak ada jalan di depanku",
      "jalan tercipta di belakangku",
      "ah, ayah",
      "ayah yang membuatku berdiri sendiri",
      "jagalah aku tanpa melepaskan pandangan dariku",
      "selalu penuhi aku dengan semangat ayah",
      "demi perjalanan yang jauh ini"
    ]
  }
}
```

**Verifikasi (data sejajar)** — jalankan:

```bash
node -e "const P=require('./src/data/poems.json'),T=require('./src/data/poem-translations.json');let bad=0;for(const p of P){const t=T[p.id];if(!t){console.log('MISSING',p.id);bad++;continue}if(t.lines_id.length!==p.lines.length){console.log('LEN',p.id,t.lines_id.length,p.lines.length);bad++}}console.log(bad===0?'OK semua sejajar':'ADA '+bad+' masalah')"
```

Expected: `OK semua sejajar`

Commit:

```bash
git add src/data/poem-translations.json
git commit -m "feat(speaking): data terjemahan puitis Indonesia 19 puisi (per baris)"
```

---

### Task 1 — Modul murni `poemTranslation.js` (TDD)

**Langkah 1a — tulis tes DULU** (harus GAGAL karena modul belum ada).

**File baru**: `src/features/speaking/poemTranslation.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  poemTranslation, translatedLine, translatedTitle, hasFullTranslation,
} from './poemTranslation.js';

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur speaking).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));
const TR = JSON.parse(readFileSync(join(ROOT, 'src/data/poem-translations.json'), 'utf8'));

test('poemTranslation: entri & null-safe', () => {
  assert.deepEqual(poemTranslation({ a: { lines_id: ['x'] } }, 'a'), { lines_id: ['x'] });
  assert.equal(poemTranslation({}, 'a'), null);
  assert.equal(poemTranslation(null, 'a'), null);
});

test('translatedLine & translatedTitle: index-based, fallback kosong', () => {
  const t = { p: { title_id: 'Judul', lines_id: ['satu', 'dua'] } };
  assert.equal(translatedLine(t, 'p', 0), 'satu');
  assert.equal(translatedLine(t, 'p', 9), '');
  assert.equal(translatedLine(t, 'x', 0), '');
  assert.equal(translatedTitle(t, 'p'), 'Judul');
  assert.equal(translatedTitle(t, 'x'), '');
});

test('hasFullTranslation: butuh jumlah baris persis & tak kosong', () => {
  const poem = { id: 'p', lines: [{}, {}] };
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', 'b'] } }, poem), true);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a'] } }, poem), false);
  assert.equal(hasFullTranslation({ p: { lines_id: ['a', ''] } }, poem), false);
  assert.equal(hasFullTranslation({}, poem), false);
});

test('poem-translations.json: SEMUA puisi punya terjemahan lengkap + judul', () => {
  assert.equal(Object.keys(TR).length, POEMS.length);
  for (const p of POEMS) {
    assert.ok(hasFullTranslation(TR, p), `terjemahan ${p.id} tidak lengkap`);
    assert.ok(translatedTitle(TR, p.id), `judul terjemahan ${p.id} kosong`);
  }
});
```

Jalankan — **expected: GAGAL** (module not found):

```bash
node --test src/features/speaking/poemTranslation.test.js
```

**Langkah 1b — implementasi minimal.**

**File baru**: `src/features/speaking/poemTranslation.js`

```js
// poemTranslation.js — akses terjemahan puitis Indonesia puisi (murni:
// tanpa DOM/React/import JSON). Data terjemahan dilewatkan sebagai parameter
// (pola sama dengan speaking.js).
// Bentuk data: { [poemId]: { title_id: string, lines_id: string[] } },
// lines_id[i] sejajar dengan poem.lines[i].

// Entri terjemahan sebuah puisi; null kalau tidak ada.
export const poemTranslation = (translations, poemId) =>
  (translations && poemId && translations[poemId]) || null;

// Terjemahan satu baris (index-based). '' kalau tidak ada.
export const translatedLine = (translations, poemId, lineIndex) => {
  const lines = poemTranslation(translations, poemId)?.lines_id;
  if (!Array.isArray(lines)) return '';
  return lines[lineIndex] || '';
};

// Judul terjemahan; '' kalau tidak ada.
export const translatedTitle = (translations, poemId) =>
  poemTranslation(translations, poemId)?.title_id || '';

// Validasi: entri ada, jumlah baris persis sama, semua baris terisi.
export const hasFullTranslation = (translations, poem) => {
  const lines = poemTranslation(translations, poem?.id)?.lines_id;
  return Array.isArray(lines) &&
    lines.length === (poem?.lines || []).length &&
    lines.every((s) => typeof s === 'string' && s.trim().length > 0);
};
```

Jalankan lagi — **expected: PASS**:

```bash
node --test src/features/speaking/poemTranslation.test.js
```

Expected: `# tests 4` … `# pass 4` … `# fail 0`

Jalankan seluruh suite — **expected: 188 pass, 0 fail**:

```bash
npm test
```

Commit:

```bash
git add src/features/speaking/poemTranslation.js src/features/speaking/poemTranslation.test.js
git commit -m "feat(speaking): modul poemTranslation + tes lengkap 19 puisi"
```

---

### Task 1b — Modul murni `poemCredits.js` (kredit penulis, TDD)

**Langkah 1a — tulis tes DULU** (harus GAGAL: modul belum ada).

**File baru**: `src/features/speaking/poemCredits.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POET_META, poetCredit, poemCredit, creditLine } from './poemCredits.js';

// Modul murni tidak meng-import JSON; test memuat sendiri (pola fitur speaking).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const POEMS = JSON.parse(readFileSync(join(ROOT, 'src/data/poems.json'), 'utf8'));

test('poetCredit: 9 penyair dikenal, null untuk tak dikenal', () => {
  assert.equal(Object.keys(POET_META).length, 9);
  assert.equal(poetCredit('松尾芭蕉').romaji, 'Matsuo Bashō');
  assert.equal(poetCredit('松尾芭蕉').dates, '1644–1694');
  assert.equal(poetCredit('誰か'), null);
  assert.equal(poetCredit(undefined), null);
});

test('poemCredit: field lengkap + fallback string kosong (aman dirender)', () => {
  const c = poemCredit({ author: '松尾芭蕉', authorReading: 'まつおばしょう', source: 'https://x' });
  assert.deepEqual(c, {
    author: '松尾芭蕉',
    authorReading: 'まつおばしょう',
    romaji: 'Matsuo Bashō',
    dates: '1644–1694',
    source: 'https://x',
  });
  assert.deepEqual(poemCredit(null), { author: '', authorReading: '', romaji: '', dates: '', source: '' });
});

test('creditLine: gabungan nama + bacaan + romaji + tahun', () => {
  assert.equal(
    creditLine({ author: '松尾芭蕉', authorReading: 'まつおばしょう' }),
    '松尾芭蕉（まつおばしょう） · Matsuo Bashō · 1644–1694',
  );
  assert.equal(creditLine(null), '');
});

test('data guard: tiap puisi punya kredit penyair + 12 puisi bertema punya sumber Aozora', () => {
  for (const p of POEMS) {
    const c = poemCredit(p);
    assert.ok(c.romaji, `${p.id}: penyair ${c.author} belum ada di POET_META`);
    assert.ok(c.dates, `${p.id}: tahun hidup penyair kosong`);
  }
  assert.equal(POEMS.filter((p) => p.source).length, 12);
  for (const p of POEMS.filter((p) => p.theme)) {
    assert.match(p.source, /^https:\/\/www\.aozora\.gr\.jp\//, `${p.id} kurang sumber Aozora`);
  }
});
```

Jalankan — **expected: GAGAL** (module not found):

```bash
node --test src/features/speaking/poemCredits.test.js
```

**Langkah 1b — implementasi.**

**File baru**: `src/features/speaking/poemCredits.js`

```js
// poemCredits.js — kredit penulis puisi (murni: tanpa DOM/React/import JSON).
// Tahun hidup & romaji TIDAK ada di poems.json → satu sumber kebenaran di sini.
// Kunci = `author` persis seperti di poems.json (guard test menjaga sinkron).
// Sumber tahun hidup: Wikipedia/Wikidata.

export const POET_META = {
  '松尾芭蕉': { romaji: 'Matsuo Bashō', dates: '1644–1694' },
  '小林一茶': { romaji: 'Kobayashi Issa', dates: '1763–1828' },
  '与謝蕪村': { romaji: 'Yosa Buson', dates: '1716–1784' },
  '小野小町': { romaji: 'Ono no Komachi', dates: 'c. 825 – c. 900' },
  '宮沢賢治': { romaji: 'Miyazawa Kenji', dates: '1896–1933' },
  '正岡子規': { romaji: 'Masaoka Shiki', dates: '1867–1902' },
  '島崎藤村': { romaji: 'Shimazaki Tōson', dates: '1872–1943' },
  '中原中也': { romaji: 'Nakahara Chūya', dates: '1907–1937' },
  '高村光太郎': { romaji: 'Takamura Kōtarō', dates: '1883–1956' },
};

// Meta penyair; null kalau tak dikenal.
export const poetCredit = (author) => POET_META[author] || null;

// Kredit lengkap sebuah puisi. Field tak dikenal → '' (bukan undefined),
// supaya aman dirender langsung di JSX.
export const poemCredit = (poem) => {
  const meta = poetCredit(poem?.author);
  return {
    author: poem?.author || '',
    authorReading: poem?.authorReading || '',
    romaji: meta?.romaji || '',
    dates: meta?.dates || '',
    source: poem?.source || '',
  };
};

// Satu baris kredit siap-render: "松尾芭蕉（まつおばしょう） · Matsuo Bashō · 1644–1694".
export const creditLine = (poem) => {
  const c = poemCredit(poem);
  return [c.author + (c.authorReading ? `（${c.authorReading}）` : ''), c.romaji, c.dates]
    .filter(Boolean)
    .join(' · ');
};
```

Jalankan lagi — **expected: PASS**: `# tests 4` … `# pass 4` … `# fail 0`.

Seluruh suite — **expected: 192 pass, 0 fail** (184 baseline + 4 poemTranslation + 4 poemCredits).

Commit:

```bash
git add src/features/speaking/poemCredits.js src/features/speaking/poemCredits.test.js
git commit -m "feat(learn): modul kredit penulis puisi (romaji + tahun hidup) + tes"
```

---

### Task 2 — Tampilkan terjemahan di `PoemSession.jsx`

**File**: `src/features/speaking/PoemSession.jsx`

**2a.** Tambah import. Di baris 6 tambahkan `speakLevel` ke import `./speaking` yang sudah ada; setelah import `playDramaticAudio` (baris 10) tambahkan dua import baru:

```jsx
// baris 6 — tambahkan speakLevel:
import { lineReading, poemLineItems, speakXpFor, lineXpFor, speakLevel, DEFAULT_SPEAK_LEVEL } from './speaking';

// setelah baris 10:
import poemTranslations from '../../data/poem-translations.json';
import { translatedLine, translatedTitle } from './poemTranslation';
```

**2b.** Tambah state (setelah baris 25 `const [showFurigana, setShowFurigana] = useState(true);`) — **default OFF di level Buta** (keputusan user):

```jsx
// Default OFF di level Buta (arti sudah jadi petunjuk) — ON di level lain.
const [showTranslation, setShowTranslation] = useState(speakLevel(level).key !== 'blind');
```

**2c.** Header — tampilkan judul terjemahan. Sisipkan setelah blok `<p>` penulis (baris 101-103), sebelum `</header>`:

```jsx
{showTranslation && translatedTitle(poemTranslations, poem.id) && (
  <p className="text-base font-serif font-bold text-ai mt-3">
    {translatedTitle(poemTranslations, poem.id)}
  </p>
)}
```

**2d.** Toggle kedua — di baris 91-94 ada `<label>` ふりがな. Tambahkan label serupa tepat sesudahnya (di dalam `<div className="flex items-center justify-between mb-6">`):

```jsx
<label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sumi/60 cursor-pointer select-none">
  <input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} />
  {id ? 'Terjemahan' : 'Translation'}
</label>
```

**2e.** Baris puisi — ganti blok kartu baris (baris 107-137) agar menampilkan terjemahan di bawahnya. Ganti `lines.map((line, i) => (` … `))` menjadi:

```jsx
{lines.map((line, i) => {
  const tr = translatedLine(poemTranslations, poem.id, i);
  return (
    <div
      key={i}
      className={`border-[3px] border-sumi p-4 transition-colors ${
        passed[i] ? 'bg-matcha/15 border-matcha' : active === i ? 'bg-kinari shadow-[4px_4px_0_0_#1a1a1a]' : 'bg-kinari/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl sm:text-3xl font-serif font-black text-sumi flex-grow leading-relaxed">
          <Furigana segments={line.segments} show={showFurigana} />
        </span>
        <button
          type="button"
          onClick={() => playDramaticAudio(lineReading(line))}
          className="shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center active:translate-y-[2px] transition-all"
          title={id ? 'Dengar' : 'Listen'}
        >
          <Volume2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => speakLine(i)}
          disabled={busy || listening}
          className={`shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center transition-all disabled:opacity-50 ${
            passed[i] ? 'bg-matcha text-kinari-light' : 'bg-ai text-kinari-light active:translate-y-[2px]'
          }`}
          title={selfAssess ? (id ? 'Tandai sudah dibaca' : 'Mark as read') : (id ? 'Ucapkan baris ini' : 'Speak this line')}
        >
          {passed[i] ? '✓' : (selfAssess ? <Check size={15} /> : <Mic size={15} />)}
        </button>
      </div>
      {showTranslation && tr && (
        <p className="mt-2 text-sm sm:text-base text-sumi/70 italic leading-relaxed">{tr}</p>
      )}
    </div>
  );
})}
```

> Catatan: `id` di sini adalah `const id = language === 'id'` (sudah ada di baris 14) — JANGAN diganti.

**Verifikasi build & lint:**

```bash
npm run build
```

Expected: `✓ built in ...` tanpa error.

```bash
npm run lint 2>&1 | grep -E "PoemSession" || echo "PoemSession bersih"
```

Expected: `PoemSession bersih`

**Uji manual cepat** (`/speaking`): pilih level **Buta** → buka puisi → toggle "Terjemahan" default **OFF**; pilih level **Pandu** → buka puisi → default **ON**.

Commit:

```bash
git add src/features/speaking/PoemSession.jsx
git commit -m "feat(speaking): terjemahan puitis per baris di PoemSession + toggle"
```

---

### Task 3 — Section "Puisi" di Learn (baca-saja + terjemahan + kredit penulis)

**3a.** Buat komponen baru (termasuk blok kredit penulis). **File baru**: `src/features/learn/PoemReader.jsx`

```jsx
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, ExternalLink } from 'lucide-react';
import poemsData from '../../data/poems.json';
import poemTranslations from '../../data/poem-translations.json';
import { Furigana } from '../speaking/Furigana';
import { POEM_THEMES, filterPoemsByTheme, lineReading } from '../speaking/speaking';
import { translatedLine, translatedTitle } from '../speaking/poemTranslation';
import { poemCredit, creditLine } from '../speaking/poemCredits';
import { useLanguage } from '../../context/LanguageContext';
import { playDramaticAudio } from '../../utils/audio';

const chip = (on) =>
  `px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] border-[3px] border-sumi transition-all ${
    on ? 'bg-shu text-kinari-light shadow-[2px_2px_0_0_#1a1a1a]' : 'bg-kinari text-sumi/60 hover:text-sumi'
  }`;

// Blok kredit penulis — WAJIB tampil di tiap puisi (keputusan user):
// nama kanji + bacaan kana + romaji + tahun hidup; link Aozora untuk puisi
// bertema, "karya klasik · domain publik" untuk puisi klasik tanpa sumber.
function PoemCredit({ poem, id }) {
  const c = poemCredit(poem);
  return (
    <div className="mt-4 flex flex-col items-center gap-0.5">
      <p className="text-xs font-bold tracking-[0.15em] text-sumi/70">
        {c.author}（{c.authorReading}）
      </p>
      <p className="text-[11px] font-bold text-sumi/50">{c.romaji} · {c.dates}</p>
      {c.source ? (
        <a
          href={c.source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ai hover:text-shu transition-colors"
        >
          {id ? 'Sumber: Aozora Bunko 青空文庫' : 'Source: Aozora Bunko 青空文庫'} <ExternalLink size={11} />
        </a>
      ) : (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-sumi/40">
          {id ? 'Karya klasik · domain publik' : 'Classic work · public domain'}
        </p>
      )}
    </div>
  );
}

// Section "Puisi" Learn — BACA-SAJA: daftar (filter tema) → puisi lengkap +
// furigana + terjemahan per baris + kredit penulis + audio. Tanpa XP/penilaian.
// Tab Puisi di Speaking (latihan mic) tidak tersentuh komponen ini.
export function PoemReader() {
  const { language } = useLanguage();
  const id = language === 'id';
  const [theme, setTheme] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);

  const poems = useMemo(() => filterPoemsByTheme(poemsData, theme), [theme]);
  const open = poemsData.find((p) => p.id === openId) || null;

  if (open) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          {id ? 'Daftar Puisi' : 'Poem List'}
        </button>

        <header className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-sumi">{open.title}</h2>
          <p className="text-xs font-bold tracking-[0.2em] text-sumi/50 mt-1">{open.titleReading}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sumi/50 mt-3">
            {open.type}{open.excerpt ? (id ? ' · kutipan' : ' · excerpt') : ''}
          </p>
          <PoemCredit poem={open} id={id} />
          {translatedTitle(poemTranslations, open.id) && (
            <p className="text-base font-serif font-bold text-ai mt-3">
              {translatedTitle(poemTranslations, open.id)}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sumi/60 cursor-pointer select-none">
              <input type="checkbox" checked={showFurigana} onChange={(e) => setShowFurigana(e.target.checked)} />
              ふりがな
            </label>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sumi/60 cursor-pointer select-none">
              <input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} />
              {id ? 'Terjemahan' : 'Translation'}
            </label>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          {open.lines.map((line, i) => {
            const tr = translatedLine(poemTranslations, open.id, i);
            return (
              <div key={i} className="border-[3px] border-sumi p-4 bg-kinari">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-serif font-black text-sumi flex-grow leading-relaxed">
                    <Furigana segments={line.segments} show={showFurigana} />
                  </span>
                  <button
                    type="button"
                    onClick={() => playDramaticAudio(lineReading(line))}
                    className="shrink-0 w-9 h-9 border-[2px] border-sumi flex items-center justify-center active:translate-y-[2px] transition-all"
                    title={id ? 'Dengar' : 'Listen'}
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
                {showTranslation && tr && (
                  <p className="mt-2 text-sm sm:text-base text-sumi/70 italic leading-relaxed">{tr}</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs font-bold text-sumi/60">
          {id ? open.meaning_id : open.meaning}
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap gap-2 mb-6">
        {POEM_THEMES.map((t) => (
          <button key={t.key} type="button" onClick={() => setTheme(t.key)} className={chip(theme === t.key)}>
            {id ? t.label : t.labelEn}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {poems.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -3 }}
            className="bg-kinari border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] p-6 cursor-pointer"
            onClick={() => setOpenId(p.id)}
          >
            <div className="text-xl font-serif font-black text-sumi mb-1">
              <Furigana segments={p.lines[0]?.segments} />
            </div>
            <p className="text-[11px] font-bold text-sumi/60 mt-1">{creditLine(p)}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sumi/50 mt-1">
              {p.type} · {p.lines.length} {id ? 'baris' : 'lines'}
            </p>
            <p className="text-sm font-serif text-ai mt-2">{translatedTitle(poemTranslations, p.id)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default PoemReader;
```

**3b.** `src/components/KanaTypeToggle.jsx` — tambah prop opsional `extraTabs` (backward compatible; Practice tidak berubah).

Ganti tanda tangan fungsi (baris 1) dan definisi `tabs` (baris 2-9) menjadi:

```jsx
export function KanaTypeToggle({ active, onChange, extraTabs = [] }) {
  const tabs = [
    { id: 'hiragana', label: 'Hiragana', jp: 'ひらがな' },
    { id: 'katakana', label: 'Katakana', jp: 'カタカナ' },
    { id: 'kotoba', label: 'Kotoba', jp: '言葉' },
    { id: 'kanji', label: 'Kanji', jp: '漢字' },
    { id: 'grammar', label: 'Grammar', jp: '文法' },
    { id: 'kurikulum', label: 'Kurikulum MNN', jp: 'カリキュラム' },
    ...extraTabs,
  ];
```

**3c.** `src/pages/Learn.jsx`:

- Import komponen (setelah baris 16 `import { KanaTypeToggle } ...`):

```jsx
import { PoemReader } from "../features/learn/PoemReader";
```

- Header: tambah cabang nama. Pada baris 86-91, sisipkan sebelum fallback `: 'Kotoba'}`:

```jsx
: activeKanaType === 'poem' ? 'Puisi 詩'
```

- Tab: beri `extraTabs`. Ganti baris 99:

```jsx
<KanaTypeToggle
  active={activeKanaType}
  onChange={handleKanaTypeChange}
  extraTabs={[{ id: 'poem', label: 'Puisi', jp: '詩' }]}
/>
```

- Konten: tambahkan cabang `poem` **di depan** ternary yang sudah ada — pakai **ternary berantai** (JANGAN membungkus ternary di dalam `{ }` bersarang: `{a ? (X) : ( {b ? …} )}` adalah **parse error**). Ganti baris 126:

```jsx
        {activeKanaType === 'kurikulum' ? (
```

menjadi:

```jsx
        {activeKanaType === 'poem' ? (
          <PoemReader />
        ) : activeKanaType === 'kurikulum' ? (
```

Sisa blok (kurikulum/daftar + penutup `)}` di baris 222) **tidak berubah** — `)}` yang sama kini menutup seluruh rantai. Jangan menyentuh filter subtype (baris 102-124) — otomatis tidak render untuk 'poem'.

**Verifikasi:**

```bash
npm run build
```

Expected: `✓ built in ...` tanpa error.

```bash
npm run lint 2>&1 | grep -E "PoemReader|Learn.jsx|KanaTypeToggle" || echo "file baru bersih"
```

Expected: `file baru bersih` (warning lama di file lain diabaikan).

**Uji manual** (jalankan `npm run dev`, buka `http://localhost:5173/learn`; ingat port bisa 5174):
1. Muncul section baru **Puisi 詩** di bar tab atas Learn.
2. Klik → chip tema (Semua/Klasik/Cinta/Kesedihan/Kesenangan/Bersyukur) + grid puisi; tiap kartu menampilkan **baris kredit** (mis. `松尾芭蕉（まつおばしょう） · Matsuo Bashō · 1644–1694`).
3. Klik 古池や → header puisi menampilkan **blok kredit**: nama + bacaan + romaji + tahun hidup, dan karena puisi klasik tanpa `source` → label **"Karya klasik · domain publik"**.
4. Klik 雨ニモマケズ → kredit `宮沢賢治（みやざわけんじ） · Miyazawa Kenji · 1896–1933` + link **"Sumber: Aozora Bunko 青空文庫"** yang membuka `aozora.gr.jp` (tab baru).
5. Terjemahan Indonesia tampil per baris (mis. baris 1 古池や = "Kolam purba —"); uncheck "Terjemahan" → hilang; uncheck ふりがな → furigana hilang.
6. Tombol ← kembali ke daftar puisi.
7. Buka `/practice` → **tidak** ada section Puisi (Practice tidak terpengaruh); buka `/speaking` → tab **Puisi 詩** masih ada dan latihan mic + XP tetap berfungsi (Speaking tidak tersentuh).

Commit:

```bash
git add src/features/learn/PoemReader.jsx src/components/KanaTypeToggle.jsx src/pages/Learn.jsx
git commit -m "feat(learn): section Puisi — baca lengkap + terjemahan Indonesia + kredit penulis"
```

---

### Task 4 — Perbarui PRD + verifikasi akhir

**File**: `PRD.md` — pada bagian `### 9.10 Speaking Practice (話)` (sekitar baris 148-159), tambahkan bullet setelah bullet furigana (baris 156):

```markdown
* **[EXISTING]** Terjemahan puitis Indonesia **per baris** untuk 19 puisi (diksi/frasa sesuai citra puisi, bukan harfiah) di `src/data/poem-translations.json`; ditampilkan di `PoemSession` (toggle "Terjemahan", default OFF di level Buta) via modul murni `src/features/speaking/poemTranslation.js`.
* **[EXISTING]** Section "Puisi 詩" di halaman Learn — baca-saja puisi lengkap + furigana + terjemahan per baris + audio + **kredit penulis** (nama penyair + romaji + tahun hidup; link sumber Aozora untuk puisi bertema, "karya klasik · domain publik" untuk puisi klasik) via `src/features/learn/PoemReader.jsx` + `src/features/speaking/poemCredits.js` — tanpa XP/penilaian/SRS.
* **[EXISTING]** Tab "Puisi 詩" di Speaking tetap sebagai latihan ucap (mic, XP per baris + XP puisi) — tidak diubah.
```

Jalankan seluruh verifikasi:

```bash
npm test
```

Expected: `# tests 192` … `# pass 192` … `# fail 0`

```bash
npm run build
```

Expected: `✓ built in ...`

```bash
npm run lint 2>&1 | grep -cE "error" || true
```

Expected: `0` (tidak ada error baru; warning lama boleh).

Commit:

```bash
git add PRD.md
git commit -m "docs(prd): 9.10 terjemahan puitis + section Puisi di Learn + kredit penulis"
```

---

## Tests / Validation

- **Unit (TDD)**: `src/features/speaking/poemTranslation.test.js` — 4 tes (aksesor + validasi data 19 puisi sejajar). Dijalankan dengan `node --test src/features/speaking/poemTranslation.test.js`.
- **Unit (TDD)**: `src/features/speaking/poemCredits.test.js` — 4 tes (aksesor kredit + guard: 9 penyair terdaftar, tiap puisi punya romaji/tahun, 12 puisi bertema punya sumber Aozora). Dijalankan dengan `node --test src/features/speaking/poemCredits.test.js`.
- **Data guard**: tes ke-4 `poemTranslation` memverifikasi SETIAP puisi punya `lines_id` dengan panjang persis sama & tak ada baris kosong → menangkap terjemahan yang lupa ditambah bila puisi baru ditambahkan nanti. Guard `poemCredits` menangkap puisi baru yang penyairnya belum ada di `POET_META`.
- **Regresi**: `npm test` (target **192 pass, 0 fail** = baseline 184 + 4 + 4) — memastikan `speaking.test.js`/`poems.test.js` lama tetap hijau.
- **Build & lint**: `npm run build` sukses; `npm run lint` tidak menambah error.
- **Manual**: checklist 7 langkah di Task 3 (termasuk cek Practice tidak berubah DAN Speaking tetap berfungsi).
- **Kenapa tidak ada tes React**: repo ini hanya menguji modul murni dengan `node --test` (tanpa jsdom). Komponen JSX divalidasi lewat build + uji manual, konsisten dengan fitur speaking/learn yang ada.

## Risks, Tradeoffs, and Open Questions

- **Risiko: importer menimpa terjemahan.** `scripts/import-aozora-poems.mjs` me-regenerate 12 puisi bertema. Karena terjemahan ada di file **terpisah** (`poem-translations.json`), aman. JANGAN memindahkannya ke `poems.json`. (Tradeoff: satu file data tambahan yang harus disinkronkan bila puisi baru ditambah — dijaga oleh tes ke-4.)
- **Risiko: `node --test` gagal resolve import JSON di modul murni.** Karena itu `poemTranslation.js` TIDAK meng-import JSON; tes yang memuat `poems.json`/`poem-translations.json` lewat `readFileSync`. Ikuti pola ini.
- **Tradeoff: terjemahan Indonesia selalu tampil** walau UI berbahasa Inggris. Sesuai permintaan (user minta terjemahan Indonesia). Bila nanti perlu versi Inggris, tinggal tambah `lines_en` + parameter bahasa di helper.
- **Tradeoff: kualitas terjemahan = penilaian selera.** Sudah diberi contoh ❌/✅ dan aturan diksi. Bila user ingin nada berbeda (mis. lebih arkais atau lebih bebas), cukup edit `lines_id` di `poem-translations.json` — tidak menyentuh kode.
- **Perhatian `id` ganda**: di `PoemSession.jsx` dan `PoemReader.jsx`, variabel `id` = "bahasa Indonesia aktif". Jangan tertukar dengan `poem.id`.
- **Keputusan user (FINAL, 27/09)**: (1) section baru bernama "Puisi" di Learn adalah rumah baca puisi; (2) tab Puisi di Speaking **tetap** (latihan mic + XP); (3) kredit penulis WAJIB tampil di Learn.
- **Risiko: `POET_META` tak sinkron.** Tahun hidup/romaji disimpan manual di `poemCredits.js`. Bila puisi baru ditambah dengan penyair baru, guard test GAGAL sampai entri ditambahkan — itu disengaja (jangan mengarang tanggal).
- **Keputusan user (FINAL, 27/09)**: terjemahan default **OFF di level Buta** (Pandu & Ingat tetap ON) — di mode Buta arti sudah jadi petunjuk; toggle tetap bisa dinyalakan manual. Implementasi: `useState(speakLevel(level).key !== 'blind')` di `PoemSession.jsx`.


---

## Log Eksekusi (27/09/2026)

Dikerjakan 00:31–00:52 (~21 menit), semua task berurutan + TDD + commit per task.

| Task | Commit | Gate |
|---|---|---|
| T0 data terjemahan | `bd7ff1a` | 19/19 puisi sejajar ✔ |
| T1 poemTranslation (TDD) | `330809f` | RED→GREEN, 4/4 ✔, suite 188 |
| T1b poemCredits (TDD) | `9d6126c` | RED→GREEN, 4/4 ✔, suite 192 |
| T2 PoemSession + toggle (OFF di Buta) | `84cf715` | build ✓, lint 0 error |
| T3 Learn section Puisi + kredit | `4e24903` | build ✓, lint 0 error |
| T4 PRD + verifikasi | `799087b` | 192/192 pass, lint 0 error, build ✓ |

**Verifikasi browser (CDP, headless Chrome — bukan sekadar build):**
- Tab **Puisi 詩** muncul di Learn; klik → grid 19 puisi, tiap kartu ber-kredit (`松尾芭蕉（まつおばしょう） · Matsuo Bashō · 1644–1694`) ✔
- Buka 古池や → kredit lengkap + fallback **"Karya klasik · domain publik"** + terjemahan baris 1–3 ✔
- Toggle "Terjemahan" ON→OFF→ON: teks hilang & balik ✔
- Buka 雨ニモマケズ → kredit Kenji + **link Aozora asli** (`aozora.gr.jp/cards/000081/...`) + 30 baris + terjemahan ✔
- `/practice` → **tidak** ada tab Puisi (Practice aman) ✔
- `/speaking` → tab Puisi **masih ada**; level **Buta** → toggle terjemahan default **OFF** ✔; level **Pandu** → default **ON** ✔
- 0 console error, 0 page error ✔

**Catatan:** plan TIDAK di-commit (aturan repo). Tidak ada push (menunggu perintah).
