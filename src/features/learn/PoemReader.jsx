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

        {/* Satu halaman puisi — baris mengalir di dalam satu kertas, bukan kotak per baris */}
        <div className="border-[3px] border-sumi bg-kinari px-4 py-8 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-6 sm:gap-7">
            {open.lines.map((line, i) => {
              const tr = translatedLine(poemTranslations, open.id, i);
              return (
                <div key={i} className="relative px-8 sm:px-10">
                  <p className="text-center text-2xl sm:text-3xl font-serif font-black text-sumi leading-loose">
                    <Furigana segments={line.segments} show={showFurigana} />
                  </p>
                  {showTranslation && tr && (
                    <p className="mt-1.5 text-center text-sm sm:text-base text-sumi/70 italic leading-relaxed">{tr}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => playDramaticAudio(lineReading(line))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 border-[2px] border-sumi/25 text-sumi/45 hover:text-sumi hover:border-sumi flex items-center justify-center transition-colors"
                    title={id ? 'Dengar' : 'Listen'}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
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
