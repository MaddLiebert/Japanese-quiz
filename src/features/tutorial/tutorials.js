// ─────────────────────────────────────────────────────────────────────────────
// Tutorial 指南 — logika MURNI (tanpa React, tanpa localStorage).
// Teks panduan Saku chann, SATU topik per halaman (context-aware): pas tombol
// "Tutorial" diklik, yang tampil = tips halaman yang lagi dibuka.
// Nada Saku: hangat, santai, bahasa awam (lihat Kepribadian Saku.md).
// Dites via `node --test`.
// ─────────────────────────────────────────────────────────────────────────────

// Setiap topik: { key, emblem, title, title_en, paths[], lines[{text, text_en}] }
// paths = rute yang memicu topik ini (dicek berurutan, paling spesifik dulu).
export const TUTORIALS = [
  {
    key: 'home',
    emblem: '🏠',
    title: 'Mulai dari Mana?',
    title_en: 'Where to Start?',
    paths: ['/'],
    lines: [
      { text: 'Halo! Aku Saku, teman belajar bahasa Jepang kamu. Di sini kamu bisa mulai dari nol, pelan-pelan aja.', text_en: "Hi! I'm Saku, your Japanese study buddy. You can start from zero here — no rush." },
      { text: 'Baru pertama kali? Mulai dari "Kuis Latihan" dulu, lalu "Latihan Menulis" biar hafal hurufnya.', text_en: 'Brand new? Start with "Practice Quiz", then "Writing Practice" to memorize the characters.' },
      { text: 'Jangan lupa cek Misi Harian di bawah — selesaikan misinya, dapat EXP sama medaru 🪙.', text_en: "Check the Daily Quests below — complete them to earn EXP and coins 🪙." },
    ],
  },
  {
    key: 'learn',
    emblem: '📖',
    title: 'Belajar Huruf & Kata',
    title_en: 'Learn Characters & Words',
    paths: ['/learn'],
    lines: [
      { text: 'Di sini kamu kenalan sama Hiragana, Katakana, dan Kanji. Ketuk kartunya buat lihat arti & dengar bacanya.', text_en: 'Meet Hiragana, Katakana, and Kanji here. Tap a card to see its meaning and hear it read.' },
      { text: 'Gak usah buru-buru hafal semua. Kenalan dulu, nanti otomatis nempel pas kamu latihan.', text_en: "No need to memorize everything at once. Get familiar first — it'll stick when you practice." },
    ],
  },
  {
    key: 'practice',
    emblem: '✏️',
    title: 'Kuis Latihan',
    title_en: 'Practice Quiz',
    paths: ['/practice'],
    lines: [
      { text: 'Pilih jumlah soal & tingkat kesulitannya, terus jawab. Makin sering latihan, makin cepat naik level.', text_en: 'Pick how many questions and the difficulty, then answer. The more you practice, the faster you level up.' },
      { text: 'Jawab bener terus, nanti muncul kejutan: kekuatan spesial karaktermu bakal nongol! (呪力 → 領域展開)', text_en: "Keep answering correctly and a surprise appears: your character's special power shows up! (Cursed Energy → Domain Expansion)" },
    ],
  },
  {
    key: 'writing',
    emblem: '🖌️',
    title: 'Latihan Menulis',
    title_en: 'Writing Practice',
    paths: ['/writing'],
    lines: [
      { text: 'Jiplak goresan hurufnya pakai mouse atau jari, ikutin urutannya.', text_en: 'Trace the strokes with your mouse or finger, following the order.' },
      { text: 'Ada level Jiplak, Ingat, dan Buta. Lulus satu level bakal buka level berikutnya.', text_en: 'There are Trace, Recall, and Blind levels. Pass one to unlock the next.' },
    ],
  },
  {
    key: 'speaking',
    emblem: '🎤',
    title: 'Latihan Bicara',
    title_en: 'Speaking Practice',
    paths: ['/speaking'],
    lines: [
      { text: 'Latihan bicara pakai mikrofon. Pastikan kamu kasih izin akses mikrofon ya.', text_en: 'Speaking practice uses your mic. Make sure to allow microphone access.' },
      { text: 'Ada tiga level: Pandu, Ingat, dan Buta. Makin tinggi levelnya, makin besar EXP-nya!', text_en: 'There are 3 levels: Guide, Recall, and Blind. Higher level, bigger EXP!' },
      { text: 'Kalau browser kamu gak dukung, gak masalah — masih ada mode mandiri buat latihan sendiri.', text_en: "If your browser doesn't support it, no worries — there's still a solo mode to practice on your own." },
    ],
  },
  {
    key: 'mondai',
    emblem: '🎧',
    title: 'Mondai (Listening)',
    title_en: 'Mondai (Listening)',
    paths: ['/mondai'],
    lines: [
      { text: 'Di Mondai, jawaban dikunci selama audionya bunyi. Dengerin dulu sampai habis ya.', text_en: 'In Mondai, answers stay locked while the audio plays. Listen till the end.' },
      { text: 'Putar audionya berkali-kali kalau perlu — yang penting kamu dengerin dengan teliti.', text_en: 'Replay the audio as many times as you need — what matters is listening carefully.' },
    ],
  },
  {
    key: 'review',
    emblem: '🔁',
    title: 'Ulang Soal Lemah',
    title_en: 'Review Weak Items',
    paths: ['/review'],
    lines: [
      { text: 'Ini tempat ngulang soal yang kamu sering salah. Sistemnya bakal nanya lagi pas kamu udah hampir lupa.', text_en: "This is where you redo questions you often get wrong. It'll ask again right when you're about to forget." },
      { text: 'Jawab bener beberapa kali, soalnya bakal "lulus" dan gak muncul lagi. Rapi kan?', text_en: 'Answer correctly a few times and the item "graduates" and stops appearing. Neat, right?' },
    ],
  },
  {
    key: 'shop',
    emblem: '🏪',
    title: 'Warung & Gacha',
    title_en: 'Shop & Gacha',
    paths: ['/shop'],
    lines: [
      { text: 'Ini tempat belanja pakai medaru 🪙. Ada barang konsumsi dan gacha pack suara karakter.', text_en: 'This is where you spend coins 🪙. There are consumable items and gacha voice packs.' },
      { text: 'Gacha buat dapetin pack suara. Kalau dapet yang udah punya, kamu balik 50 medaru.', text_en: 'Gacha gets you voice packs. Get a duplicate and you get 50 coins back.' },
      { text: 'Kumpulin medaru dari jawaban bener, misi harian, dan Death Quiz ya!', text_en: 'Earn coins from correct answers, daily quests, and Death Quiz!' },
    ],
  },
  {
    key: 'inventory',
    emblem: '🎒',
    title: 'Tas Punggung',
    title_en: 'Backpack',
    paths: ['/inventory'],
    lines: [
      { text: 'Semua pack & barang yang kamu punya ada di sini.', text_en: 'All the packs and items you own live here.' },
      { text: 'Tekan tombol PAKAI buat masang pack-nya. Suara dan efeknya langsung ganti.', text_en: 'Press the USE button to equip a pack. Voice and effects change instantly.' },
    ],
  },
  {
    key: 'death-quiz',
    emblem: '💀',
    title: 'Death Quiz 死闘',
    title_en: 'Death Quiz',
    paths: ['/death-quiz'],
    lines: [
      { text: 'Hati-hati! Di Death Quiz, XP kamu bisa berkurang kalau salah. Tapi hadiah medarunya gede.', text_en: 'Careful! In Death Quiz you can lose XP. But the coin rewards are big.' },
      { text: 'Kamu punya beberapa nyawa. Kalau habis, sesinya berakhir dan XP kamu kepotong.', text_en: 'You have several lives. Run out and the run ends and you lose some XP.' },
    ],
  },
  {
    key: 'n5-exam',
    emblem: '📜',
    title: 'Ujian N5 模擬試験',
    title_en: 'N5 Exam',
    paths: ['/n5-exam'],
    lines: [
      { text: 'Ujian N5 butuh sembilan puluh menit, tiga seksi. Lulus kalau skor kamu delapan puluh ke atas.', text_en: 'The N5 exam takes 90 minutes, 3 sections. Pass with a score of 80 or more.' },
      { text: 'Ini tiruan JLPT N5 asli. Waktu berjalan terus, jadi jangan kelamaan di satu soal ya.', text_en: 'This mirrors the real JLPT N5. The clock keeps running, so don\'t linger on one question.' },
      { text: 'Kalau lulus, kamu dapat sertifikat & cap. Semangat!', text_en: 'Pass and you earn a certificate and a stamp. You got this!' },
    ],
  },
  {
    key: 'settings',
    emblem: '⚙️',
    title: 'Pengaturan',
    title_en: 'Settings',
    paths: ['/settings'],
    lines: [
      { text: 'Di sini kamu bisa ganti bahasa aplikasi dan tema (terang/gelap).', text_en: 'Here you can switch the app language and theme (light/dark).' },
      { text: 'Ada juga tombol reset kalau kamu mau mulai dari nol lagi. Hati-hati, gak bisa dibalikin!', text_en: "There's also a reset button if you want a fresh start. Careful — it can't be undone!" },
    ],
  },
  {
    key: 'profile',
    emblem: '👺',
    title: 'Profil & Cap',
    title_en: 'Profile & Stamps',
    paths: ['/profile'],
    lines: [
      { text: 'Di sini semua cap pencapaian kamu kumpul. Ada yang legendary, loh!', text_en: 'All your achievement stamps are collected here. Some are legendary!' },
      { text: 'Pilih cap favoritmu buat dipajang di halaman depan.', text_en: 'Pick your favorite stamps to display on the front page.' },
    ],
  },
];

export const DEFAULT_TUTORIAL_KEY = 'home';

// Cari topik dari sebuah path. Fallback ke home kalau tak ada yang cocok.
export const tutorialFor = (pathname) => {
  const path = typeof pathname === 'string' ? pathname : '';
  // Normalkan: buang query/hash + trailing slash (kecuali root).
  let clean = path.split('?')[0].split('#')[0];
  if (clean.length > 1) clean = clean.replace(/\/+$/, '');
  if (clean === '') clean = '/';
  const hit = TUTORIALS.find((t) => t.paths.includes(clean));
  return hit || TUTORIALS.find((t) => t.key === DEFAULT_TUTORIAL_KEY) || TUTORIALS[0];
};

// Key topik dari path (praktis untuk hasSeen/markSeen).
export const tutorialKey = (pathname) => tutorialFor(pathname).key;

// ── State "sudah dibaca" (disimpan di progress.tutorialSeen) ────────────────

export const emptySeen = () => ({});

// Sampah / bukan objek → {}. Objek valid → apa adanya.
export const ensureSeen = (seen) => {
  if (!seen || typeof seen !== 'object' || Array.isArray(seen)) return emptySeen();
  return seen;
};

export const hasSeen = (seen, pathname) => {
  const key = tutorialKey(pathname);
  return ensureSeen(seen)[key] === true;
};

// Tandai topik sudah dibaca. Immutable; tandai 2× hasilnya sama.
export const markSeen = (seen, pathname) => {
  const base = ensureSeen(seen);
  const key = tutorialKey(pathname);
  if (base[key] === true) return base;
  return { ...base, [key]: true };
};

// Berapa topik yang belum dibaca (untuk badge "baru").
export const unseenCount = (seen) => {
  const base = ensureSeen(seen);
  return TUTORIALS.reduce((n, t) => (base[t.key] === true ? n : n + 1), 0);
};
