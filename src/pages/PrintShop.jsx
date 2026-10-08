// 印刷所 — ruang "pabrik" app (M14 easter egg). Muncul kalau pemain sudah
// menyusun beberapa edisi di era Meiji. Gelap: mesin berjalan, tumpukan halaman
// setengah jadi, sisa era lain (Heian belum dicetak, Edo dibuang), dan satu
// halaman bertanggal masa depan (cyberpunk).
// Spec: docs/tema/meiji-mekanik.md §M14.
import { useNavigate } from 'react-router-dom';
import { EraPaper } from '../components/EraPaper';
import { useLanguage } from '../context/LanguageContext';
import { PRINT_SHOP_ARTIFACTS } from '../features/printshop/printshop';

export function PrintShop() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <EraPaper />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sumi/70 transition-colors hover:text-sumi"
      >
        ← {id ? 'Kembali' : 'Back'}
      </button>

      <header className="mb-8 border-b-[3px] border-double border-sumi pb-4">
        <h1 className="font-serif font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.2rem)' }}>
          印刷所
        </h1>
        <p className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.3em] text-sumi/55">
          {id ? 'Percetakan · di balik koran' : 'Print Shop · behind the paper'}
        </p>
      </header>

      <p className="mb-8 max-w-prose font-serif text-sm leading-relaxed text-sumi/75">
        {id
          ? 'Mesin masih berjalan. Tumpukan halaman setengah jadi menunggu. Di rak belakang, sisa-sisa era lain — dan satu halaman yang belum seharusnya ada.'
          : 'The press still runs. Stacks of half-made pages wait. On the back shelf, remnants of other eras — and one page that should not yet exist.'}
      </p>

      <ul className="space-y-4">
        {PRINT_SHOP_ARTIFACTS.map((a) => (
          <li
            key={a.id}
            className={`border-l-[3px] py-4 pl-5 pr-4 ${
              a.id === 'future' ? 'border-renga bg-renga/10' : 'border-sumi/30 bg-kinari-light/40'
            }`}
            style={{ borderRadius: 0 }}
          >
            <p className={`font-serif text-lg font-bold ${a.id === 'future' ? 'text-renga' : 'text-sumi'}`}>
              {a.jp}
            </p>
            <p className="mt-1 font-sans text-xs text-sumi/60">{id ? a.id_text : a.id_text}</p>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-center font-serif text-sm italic text-sumi/50">
        {id ? '…jangan beri tahu siapa pun soal halaman itu.' : '…don\u2019t tell anyone about that page.'}
      </p>
    </div>
  );
}

export default PrintShop;
