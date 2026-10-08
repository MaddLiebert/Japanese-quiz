// Codex つながり — glosarium lintas-era (M4). Meiji = SIMPUL penghubung
// Edo → Meiji → Shōwa. Istilah yang meng-echo istilah era sebelumnya memunculkan
// catatan 「つながり」. Data-driven: nambah node = nambah data, bukan kode.
// Spec: docs/tema/meiji-mekanik.md §M4.
import { useNavigate } from 'react-router-dom';
import { EraPaper } from '../components/EraPaper';
import { useLanguage } from '../context/LanguageContext';
import { THREADS } from '../features/codex/threads';

export function Codex() {
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
        <h1 className="font-serif font-black text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3rem)' }}>
          Codex つながり
        </h1>
        <p className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.3em] text-sumi/55">
          {id ? 'Benang lintas-era · Edo → Meiji → Shōwa' : 'Cross-era threads · Edo → Meiji → Shōwa'}
        </p>
      </header>

      <p className="mb-8 max-w-prose font-serif text-sm leading-relaxed text-sumi/75">
        {id
          ? 'Satu benda, tiga zaman. Meiji bukan awal — ia simpul yang menyambung.'
          : 'One thing, three ages. Meiji is not a beginning — it is the knot that ties them.'}
      </p>

      <ul className="space-y-5">
        {THREADS.map((t) => (
          <li key={t.id} className="border-l-[3px] border-renga/60 bg-kinari-light/40 py-4 pl-5 pr-4" style={{ borderRadius: 0 }}>
            <div className="flex items-center gap-3">
              <span className="border border-shu/50 px-2 py-0.5 font-serif text-sm font-bold text-shu" style={{ borderRadius: 0 }}>
                {t.label_jp}
              </span>
              <span className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/45">つながり</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {t.chain.map((node, i) => (
                <span key={node} className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 font-sans text-xs font-bold ${
                      node.includes('(meiji)') ? 'border-[2px] border-renga bg-renga/10 text-renga' : 'border border-sumi/25 text-sumi/70'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {node}
                  </span>
                  {i < t.chain.length - 1 && <span className="text-sumi/30">→</span>}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Codex;
