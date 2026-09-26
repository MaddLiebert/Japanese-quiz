import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { SpeakSession } from '../features/speaking/SpeakSession';
import { PoemSession } from '../features/speaking/PoemSession';
import { Furigana } from '../features/speaking/Furigana';
import {
  kanaSpeakItems, kotobaSpeakItems, kanjiSpeakItems, filterKanaByType,
  SPEAK_LEVELS, DEFAULT_SPEAK_LEVEL,
} from '../features/speaking/speaking';
import { isSpeechRecognitionSupported } from '../features/speaking/useSpeechRecognition';
import { useItemProgress } from '../features/progress/ProgressContext';
import { useLanguage } from '../context/LanguageContext';
import hiraganaData from '../data/hiragana.json';
import katakanaData from '../data/katakana.json';
import kotobaData from '../data/kotoba.json';
import kanjiData from '../data/kanji.json';
import poemsData from '../data/poems.json';

const TABS = [
  { key: 'hiragana', label: 'Hiragana ひらがな' },
  { key: 'katakana', label: 'Katakana カタカナ' },
  { key: 'kotoba', label: 'Kotoba 言葉' },
  { key: 'kanji', label: 'Kanji 漢字' },
  { key: 'poem', label: 'Puisi 詩' },
];

const KANA_TYPES = [
  { key: 'all', label: 'Semua' },
  { key: 'seion', label: 'Seion' },
  { key: 'dakuon', label: 'Dakuon' },
  { key: 'handakuon', label: 'Handakuon' },
  { key: 'yoon', label: 'Yoon' },
];

const chip = (on) =>
  `px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] border-[3px] border-sumi transition-all ${
    on ? 'bg-shu text-kinari-light shadow-[2px_2px_0_0_#1a1a1a]' : 'bg-kinari text-sumi/60 hover:text-sumi'
  }`;

export function Speaking() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';
  const { itemProgress } = useItemProgress();

  const [tab, setTab] = useState('hiragana');
  const [kanaType, setKanaType] = useState('all');
  const [kotobaCategory, setKotobaCategory] = useState(() => kotobaData[0]?.category || '');
  const [kanjiCategory, setKanjiCategory] = useState(() => kanjiData[0]?.category || '');
  const [session, setSession] = useState(null);   // { items, index }
  const [poem, setPoem] = useState(null);
  const [level, setLevel] = useState(DEFAULT_SPEAK_LEVEL);

  const supported = isSpeechRecognitionSupported();

  const hiraganaItems = useMemo(
    () => kanaSpeakItems(filterKanaByType(hiraganaData, kanaType), 'hiragana'),
    [kanaType],
  );
  const katakanaItems = useMemo(() => kanaSpeakItems(katakanaData, 'katakana'), []);
  const kotobaCategories = useMemo(() => [...new Set(kotobaData.map((d) => d.category))], []);
  const kotobaItems = useMemo(
    () => kotobaSpeakItems(kotobaData.filter((d) => d.category === kotobaCategory)),
    [kotobaCategory],
  );
  const kanjiCategories = useMemo(() => [...new Set(kanjiData.map((d) => d.category))], []);
  const kanjiItems = useMemo(
    () => kanjiSpeakItems(kanjiData.filter((d) => d.category === kanjiCategory)),
    [kanjiCategory],
  );

  if (session) {
    return (
      <SpeakSession
        items={session.items}
        startIndex={session.index}
        level={level}
        onExit={() => setSession(null)}
      />
    );
  }
  if (poem) {
    return <PoemSession poem={poem} level={level} onExit={() => setPoem(null)} />;
  }

  const mastered = (itemId) => itemProgress[itemId]?.status === 'mastered';

  const itemGrid = (items, labelFn) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          onClick={() => setSession({ items, index: i })}
          className="bg-kinari border-[3px] border-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 flex flex-col items-center gap-1 relative"
        >
          {mastered(it.id) && <span className="absolute top-1 right-1 text-[9px] text-matcha font-black">✓</span>}
          <span className="text-3xl font-serif font-black text-sumi leading-none">{it.display}</span>
          <span className="text-[10px] font-bold text-sumi/50 uppercase tracking-wider truncate w-full">
            {labelFn(it)}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> {id ? 'Kembali' : 'Back'}
      </button>

      <header className="mb-8 relative overflow-hidden">
        <h1 className="text-4xl sm:text-7xl md:text-8xl font-serif font-black text-sumi tracking-tighter relative z-10">
          話 <span className="text-shu">{id ? 'Latihan Bicara' : 'Speaking'}</span>
        </h1>
        <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-4 sm:mt-6 relative z-10">
          {id
            ? 'Ucapkan kana, kotoba, kanji & puisi — 3 level: Pandu / Ingat / Buta'
            : 'Speak kana, words, kanji & poems — 3 levels: Guide / Recall / Blind'}
        </p>
      </header>

      {!supported && (
        <div className="mb-8 px-5 py-4 border-[3px] border-dashed border-shu/50 text-shu text-xs font-bold">
          {id
            ? '⚠️ Browser ini tidak mendukung pengenalan suara (coba Chrome/Edge). Mode latihan mandiri aktif: tombol "Sudah Baca" — tanpa penilaian & XP.'
            : '⚠️ This browser does not support speech recognition (try Chrome/Edge). Self-assess mode is active: "Read ✓" — no scoring & XP.'}
        </div>
      )}

      {/* Level kesulitan — bebas dipilih, tanpa gating */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sumi/50 mr-1">
          Level
        </span>
        {Object.values(SPEAK_LEVELS).map((l) => (
          <button key={l.key} type="button" onClick={() => setLevel(l.key)} className={chip(level === l.key)}>
            {l.label} · ×{l.xpMult}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-end gap-4 sm:gap-8 border-b-[2px] border-sumi/10 mb-8 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`pb-4 text-[10px] font-bold tracking-[0.3em] uppercase border-b-[4px] -mb-[2px] shrink-0 transition-colors ${
              tab === t.key ? 'border-ai text-ai' : 'border-transparent text-sumi/40 hover:text-sumi/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hiragana' && (
        <section>
          <div className="flex flex-wrap gap-2 mb-6">
            {KANA_TYPES.map((t) => (
              <button key={t.key} type="button" onClick={() => setKanaType(t.key)} className={chip(kanaType === t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          {itemGrid(hiraganaItems, (it) => it.meaning)}
        </section>
      )}

      {tab === 'katakana' && (
        <section>{itemGrid(katakanaItems, (it) => it.meaning)}</section>
      )}

      {tab === 'kotoba' && (
        <section>
          <div className="mb-6">
            <select
              value={kotobaCategory}
              onChange={(e) => setKotobaCategory(e.target.value)}
              className="bg-kinari border-[3px] border-sumi px-4 py-2 text-xs font-black uppercase tracking-widest"
            >
              {kotobaCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {itemGrid(kotobaItems, (it) => (id ? it.meaningId : it.meaning))}
        </section>
      )}

      {tab === 'kanji' && (
        <section>
          <div className="flex flex-wrap gap-2 mb-6">
            {kanjiCategories.map((c) => (
              <button key={c} type="button" onClick={() => setKanjiCategory(c)} className={chip(kanjiCategory === c)}>
                {c}
              </button>
            ))}
          </div>
          {itemGrid(kanjiItems, (it) => (id ? it.meaningId : it.meaning))}
        </section>
      )}

      {tab === 'poem' && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {poemsData.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -3 }}
                className="bg-kinari border-[3px] border-sumi shadow-[5px_5px_0_0_#1a1a1a] p-6 cursor-pointer"
                onClick={() => setPoem(p)}
              >
                <div className="text-xl font-serif font-black text-sumi mb-1">
                  <Furigana segments={p.lines[0]?.segments} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sumi/50">
                  {p.author} · {p.type}{p.excerpt ? (id ? ' · kutipan' : ' · excerpt') : ''}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Speaking;
