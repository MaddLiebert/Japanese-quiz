// ─────────────────────────────────────────────────────────────────────────────
// 平安の歴史 — halaman sejarah Heian LENGKAP (terpisah dari cinematic).
// Dibuka dari layar pilihan setelah cinematic ("Pelajari Sejarah Heian Lebih
// Lanjut"), atau kapan saja dari menu.
//
// Struktur: tiap bab = satu kartu washi dengan judul Jepang (kanji, elemen
// utama) + terjemahan Indonesia. Data-driven (HEIAN_HISTORY) supaya mudah
// ditambah. Tombol "Putar ulang cinematic" tersedia di atas.
//
// Memakai ulang komponen tema Heian yang sudah ada: EraPaper (kertas washi),
// token [data-era="heian"], font brush --font-display.
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { EraPaper } from '../components/EraPaper';
import { useLanguage } from '../context/LanguageContext';
import { useCinematic } from '../features/cinematic/CinematicContext';

// Konten sejarah — judul Jepang = elemen utama, terjemahan menyusul (sama
// filosofinya dengan cinematic). Kanji di sini SAH: ini kalimat sejarah asli.
export const HEIAN_HISTORY = [
  {
    id: 'capital',
    jp: '平安京への遷都',
    romaji: 'Heian-kyō e no sento',
    id_title: 'Pemindahan Ibu Kota ke Heian-kyō',
    body: 'Tahun 794, Kaisar Kanmu memindahkan ibu kota ke Heian-kyō (kini Kyoto). Kota ini dirancang meniru ibu kota Tiongkok, dengan grid jalan yang rapi. Heian-kyō menjadi pusat pemerintahan selama lebih dari seribu tahun.',
    body_id: 'Pada 794, Kaisar Kanmu memindahkan ibu kota ke Heian-kyō (sekarang Kyoto). Kota ini dirancang meniru ibu kota Tiongkok, dengan tata jalan berpetak yang rapi — dan menjadi pusat pemerintahan lebih dari seribu tahun.',
  },
  {
    id: 'court',
    jp: '宮廷文化の花開き',
    romaji: 'Kyūtei bunka no hanabiraki',
    id_title: 'Mekarnya Budaya Istana',
    body: 'Kaum bangsawan (kuge) mengembangkan budaya istana yang halus: puisi, musik, kaligrafi, dan tata krama. Keindahan dan kepekaan rasa (miyabi) menjadi nilai tertinggi.',
    body_id: 'Kaum bangsawan (kuge) mengembangkan budaya istana yang halus — puisi, musik, kaligrafi, dan tata krama. Kepekaan estetis (miyabi) menjadi nilai tertinggi pada masa ini.',
  },
  {
    id: 'kana',
    jp: 'かな文字の発明',
    romaji: 'Kana moji no hatsumei',
    id_title: 'Lahirnya Aksara Kana',
    body: 'Dari penyederhanaan kanji lahirlah hiragana dan katakana. Kana memungkinkan penulisan bahasa Jepang apa adanya, dan membuka jalan bagi sastra yang ditulis oleh — dan untuk — perempuan istana.',
    body_id: 'Dari penyederhanaan kanji lahirlah hiragana dan katakana. Kana memungkinkan bahasa Jepang ditulis apa adanya, dan membuka jalan bagi sastra yang ditulis oleh — dan untuk — perempuan istana.',
  },
  {
    id: 'genji',
    jp: '源氏物語と紫式部',
    romaji: 'Genji Monogatari to Murasaki Shikibu',
    id_title: 'Genji Monogatari & Murasaki Shikibu',
    body: 'Sekitar tahun 1008, Murasaki Shikibu menulis Genji Monogatari — sering disebut novel pertama di dunia. Kisah ini mengikuti kehidupan Pangeran Genji dan menjadi puncak sastra Heian.',
    body_id: 'Sekitar 1008, Murasaki Shikibu menulis Genji Monogatari — sering disebut novel pertama di dunia. Kisah Pangeran Genji ini menjadi puncak sastra zaman Heian.',
  },
  {
    id: 'end',
    jp: '時代の終わり',
    romaji: 'Jidai no owari',
    id_title: 'Akhir Sebuah Zaman',
    body: 'Kekuasaan bangsawan memudar saat kelas samurai bangkit. Tahun 1185 menandai berakhirnya Heian dan dimulainya zaman Kamakura — dunia baru para panglima perang.',
    body_id: 'Kekuasaan kaum bangsawan memudar seiring bangkitnya kelas samurai. Tahun 1185 menandai berakhirnya Heian dan mulainya zaman Kamakura — dunia para panglima perang.',
  },
];

export function HeianHistory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { play } = useCinematic();
  const id = language === 'id';

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <EraPaper />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sumi/70 transition-colors hover:text-sumi"
        >
          ← {id ? 'Kembali' : 'Back'}
        </button>

        <h1
          className="font-serif font-black leading-tight text-sumi"
          style={{ fontSize: 'clamp(2rem, 7vw, 3.4rem)' }}
        >
          平安時代
        </h1>
        <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-kin">
          794 — 1185 · {id ? 'Sejarah Heian' : 'Heian History'}
        </p>
        <p className="mt-4 max-w-prose font-sans text-sm font-semibold leading-relaxed text-sumi/75">
          {id
            ? 'Lebih dari empat abad kedamaian dan budaya halus — zaman ketika sastra, kaligrafi, dan kepekaan rasa mencapai puncaknya di Jepang.'
            : 'More than four centuries of peace and refined culture — an age when literature, calligraphy, and aesthetic sensibility peaked in Japan.'}
        </p>

        {/* Putar ulang cinematic */}
        <button
          type="button"
          onClick={() => play('heian')}
          className="mt-6 inline-flex items-center gap-2 border-2 border-kin px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-kin transition-colors hover:bg-kin hover:text-kinari-light"
          style={{ borderRadius: 2 }}
        >
          ▶ {id ? 'Putar Ulang Cinematic' : 'Replay Cinematic'}
        </button>
      </div>

      {/* Bab-bab sejarah */}
      <div className="relative z-10 space-y-6">
        {HEIAN_HISTORY.map((ch, i) => (
          <article
            key={ch.id}
            className="relative border-l-[3px] border-kin/60 bg-kinari-light/40 py-4 pl-5 pr-4"
            style={{ borderRadius: 2 }}
          >
            <span className="absolute -left-[11px] top-4 h-[18px] w-[18px] rounded-full border-2 border-kin bg-kinari" aria-hidden="true" />
            <p className="font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-kin">
              {String(i + 1).padStart(2, '0')} · {ch.romaji}
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold leading-snug text-sumi sm:text-2xl">
              {ch.jp}
            </h2>
            <p className="mt-0.5 font-sans text-sm font-bold text-sumi/85">
              {ch.id_title}
            </p>
            <p className="mt-2.5 max-w-prose font-sans text-sm leading-relaxed text-sumi/70">
              {id ? ch.body_id : ch.body}
            </p>
          </article>
        ))}
      </div>

      {/* Penutup */}
      <div className="relative z-10 mt-10 border-t-2 border-kin/40 pt-6 text-center">
        <p
          className="font-serif font-black text-sumi"
          style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: '0.1em' }}
        >
          ようこそ、平安へ。
        </p>
        <p className="mt-1 font-sans text-sm font-semibold text-sumi/70">
          {id ? 'Selamat datang di Heian.' : 'Welcome to Heian.'}
        </p>
      </div>
    </div>
  );
}

export default HeianHistory;
