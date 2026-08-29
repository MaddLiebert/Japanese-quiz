import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import hiraganaData from "../data/hiragana.json";
import katakanaData from "../data/katakana.json";
import kotobaData from "../data/kotoba.json";
import grammarData from "../data/grammar.json";
import kanjiData from "../data/kanji.json";
import { useItemProgress } from "../features/progress/ProgressContext";
import { Flashcard } from "../features/learn/Flashcard";
import { Button } from "../components/ui/Button";
import { useLanguage } from "../context/LanguageContext";
import { categoryTranslations } from "../utils/translations";
import { Search } from "lucide-react";

// ─── Editorial Kana Type Toggle ────────────────────────────────────────────────
function KanaTypeToggle({ active, onChange }) {
  const tabs = [
    { id: 'hiragana', label: 'Hiragana', jp: 'ひらがな' },
    { id: 'katakana', label: 'Katakana', jp: 'カタカナ' },
    { id: 'kotoba', label: 'Kotoba', jp: '言葉' },
    { id: 'kanji', label: 'Kanji', jp: '漢字' },
    { id: 'grammar', label: 'Grammar', jp: '文法' },
  ];
  return (
    <div className="flex items-end gap-4 sm:gap-8 border-b-[2px] border-sumi/10 pb-0 mb-8 sm:mb-12 overflow-x-auto no-scrollbar flex-nowrap">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-4 flex flex-col items-start gap-1 transition-colors border-b-[4px] -mb-[2px] shrink-0 ${
            active === tab.id
              ? 'border-ai text-ai'
              : 'border-transparent text-sumi/40 hover:text-sumi/70'
          }`}
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">{tab.label}</span>
          <span className="text-lg font-serif font-black">{tab.jp}</span>
        </button>
      ))}
    </div>
  );
}

export function Learn() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { itemProgress, forceMasterItem } = useItemProgress();
  const [activeKanaType, setActiveKanaType] = useState('hiragana');
  const [selectedRow, setSelectedRow] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeKanaSubtype, setActiveKanaSubtype] = useState('all');

  const activeData = activeKanaType === 'hiragana'
    ? hiraganaData
    : activeKanaType === 'katakana'
      ? katakanaData
      : activeKanaType === 'kanji'
        ? kanjiData
        : activeKanaType === 'grammar'
          ? grammarData
          : kotobaData;

  const filteredData = activeData.filter(item => {
    if (activeKanaType !== 'hiragana' && activeKanaType !== 'katakana') return true;
    if (activeKanaSubtype === 'all') return true;
    return item.type === activeKanaSubtype;
  });

  const rows = (activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji')
    ? [...new Set(filteredData.map(kana => kana.category))]
    : [...new Set(filteredData.map(kana => kana.row))];

  const filteredRows = rows.filter(row => {
    if (!searchTerm) return true;
    const translatedName = language === 'id' && categoryTranslations[row] ? categoryTranslations[row] : row;
    const term = searchTerm.toLowerCase();
    return row.toLowerCase().includes(term) || translatedName.toLowerCase().includes(term);
  });

  const handleKanaTypeChange = (type) => {
    setActiveKanaType(type);
    setSelectedRow(null);
    setCurrentCardIndex(0);
    setSearchTerm('');
    setActiveKanaSubtype('all');
  };

  const handleRowSelect = (row) => {
    setSelectedRow(row);
    setCurrentCardIndex(0);
  };

  const handleToggleMastery = (kanaId) => {
    forceMasterItem(kanaId);
  };

  // ── Row Selection View ────────────────────────────────────────────────────────
  if (!selectedRow) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
        <button 
          onClick={() => navigate(-1)}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 group relative z-20"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali' : 'Back'}
        </button>
        <header className="mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-seigaiha opacity-[0.05] pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
          <h1 className="text-4xl sm:text-7xl md:text-8xl font-serif font-black text-sumi tracking-tighter relative z-10">
            {language === 'id' ? 'Belajar' : 'Learn'} <span className="text-shu">
              {activeKanaType === 'hiragana' ? 'Hiragana'
                : activeKanaType === 'katakana' ? 'Katakana'
                : activeKanaType === 'kanji' ? '漢字 Kanji'
                : activeKanaType === 'grammar' ? 'Grammar'
                : 'Kotoba'}
            </span>
          </h1>
          <p className="text-xs font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-sumi/60 mt-4 sm:mt-6 relative z-10">
            {language === 'id' ? 'Pilih kategori untuk mulai belajar' : 'Select a row to begin your study session'}
          </p>
        </header>

        <KanaTypeToggle active={activeKanaType} onChange={handleKanaTypeChange} />

        {/* Kana Subtype Filter */}
        {['hiragana', 'katakana'].includes(activeKanaType) && (
          <div className="flex gap-2 sm:gap-4 mb-8 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'all', label: language === 'id' ? 'Semua' : 'All' },
              { id: 'seion', label: 'Seion (Basic)' },
              { id: 'dakuon', label: 'Dakuon (゛)' },
              { id: 'handakuon', label: 'Handakuon (゜)' },
              { id: 'yoon', label: 'Yoon (ゃゅょ)' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => { setActiveKanaSubtype(type.id); setSelectedRow(null); }}
                className={`px-4 py-2 text-xs font-bold tracking-widest uppercase border-[2px] transition-colors whitespace-nowrap ${
                  activeKanaSubtype === type.id
                    ? 'bg-sumi text-kinari-light border-sumi'
                    : 'bg-kinari-light text-sumi/60 border-sumi/20 hover:border-sumi/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sumi/40">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'id' ? "Cari kategori (misal: Kerja, Waktu)..." : "Search categories..."}
            className="w-full bg-kinari-light border-[3px] border-sumi/20 focus:border-sumi py-3 pl-12 pr-4 text-sumi font-medium shadow-[4px_4px_0_0_rgba(26,26,26,0.05)] focus:shadow-[4px_4px_0_0_rgba(26,26,26,1)] transition-all outline-none rounded-none placeholder:text-sumi/40"
          />
        </div>

        {filteredRows.length === 0 && (
          <div className="py-12 text-center text-sumi/60 font-bold uppercase tracking-widest text-sm">
            {language === 'id' ? 'Kategori tidak ditemukan.' : 'No categories found.'}
          </div>
        )}

        <div className="grid grid-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
          {filteredRows.map(row => {
            const rowItems = (activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji')
              ? activeData.filter(k => k.category === row)
              : filteredData.filter(k => k.row === row);
            const masteredCount = rowItems.filter(k => itemProgress[k.id]?.status === 'mastered').length;
            const progress = (masteredCount / rowItems.length) * 100;
            
            return (
              <motion.div
                key={row}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRowSelect(row)}
                className="bg-kinari border-[3px] border-sumi shadow-[6px_6px_0_0_#1a1a1a] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer p-8 flex flex-col relative overflow-hidden group min-h-[200px]"
              >
                <div className="absolute inset-0 bg-seigaiha opacity-[0.03] group-hover:opacity-10 transition-opacity"></div>
                <div className="relative z-10 flex items-start justify-between w-full mb-8">
                  <h2 className="text-3xl font-serif text-sumi capitalize font-bold leading-tight">
                    {(activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji') 
                      ? (language === 'id' && categoryTranslations[row] ? categoryTranslations[row] : row) 
                      : `${row} 行`}
                  </h2>
                  <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-sumi/50 bg-kinari-light border-2 border-sumi/20 px-2 py-1 shrink-0 ml-4">
                    {rowItems.length} {language === 'id' 
                      ? (activeKanaType === 'grammar' ? 'Soal' : activeKanaType === 'kanji' ? 'Kanji' : activeKanaType === 'kotoba' ? 'Kata' : 'Huruf') 
                      : (activeKanaType === 'grammar' ? 'Rules' : activeKanaType === 'kanji' ? 'Kanji' : activeKanaType === 'kotoba' ? 'Words' : 'Char')}
                  </div>
                </div>
                
                <div className="relative z-10 mt-auto w-full">
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-[9px] uppercase tracking-[0.2em] text-sumi/60 font-bold">
                       {language === 'id' ? 'Progres' : 'Mastery'}
                     </span>
                     <span className="text-[10px] font-bold text-sumi font-serif">{masteredCount}/{rowItems.length}</span>
                   </div>
                   <div className="w-full h-[4px] bg-sumi/10">
                     <div className="h-full bg-ai transition-all duration-500" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Flashcard View ────────────────────────────────────────────────────────────
  const rowKana = (activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji')
    ? activeData.filter(k => k.category === selectedRow)
    : activeData.filter(k => k.row === selectedRow && (activeKanaSubtype === 'all' || k.type === activeKanaSubtype));
  const currentKana = rowKana[currentCardIndex];
  const isMastered = itemProgress[currentKana?.id]?.status === 'mastered';

  const handleNext = () => {
    if (currentCardIndex < rowKana.length - 1) setCurrentCardIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) setCurrentCardIndex(prev => prev - 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen flex flex-col">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12 border-b-[4px] border-sumi pb-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-asanoha opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
        <div className="relative z-10">
          <button 
            onClick={() => setSelectedRow(null)}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-4 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> {language === 'id' ? 'Kembali ke Kategori' : 'Back to Rows'}
          </button>
          <h1 className="text-4xl sm:text-5xl font-serif font-black text-sumi capitalize flex items-center gap-4">
            {(language === 'id' && categoryTranslations[selectedRow]) ? categoryTranslations[selectedRow] : selectedRow}{' '}
            {(activeKanaType === 'kotoba' || activeKanaType === 'grammar' || activeKanaType === 'kanji') ? '' : 'Row'}{' '}
            {(activeKanaType !== 'kotoba' && activeKanaType !== 'grammar' && activeKanaType !== 'kanji') && <span className="text-xl sm:text-2xl text-sumi/40 font-normal">({selectedRow}行)</span>}
          </h1>
        </div>
        <div className="text-sm font-bold tracking-[0.3em] text-sumi bg-kinari border-[3px] border-sumi px-6 py-2 shadow-[4px_4px_0_0_#1a1a1a] relative z-10">
          <span className="text-ai">{currentCardIndex + 1}</span> / {rowKana.length}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center pb-12 sm:pb-20 w-full max-w-4xl mx-auto">
        <Flashcard 
          key={currentKana.id}
          kana={currentKana}
          isMastered={isMastered}
          onToggleMastery={() => handleToggleMastery(currentKana.id)}
        />
        
        <div className="flex items-center gap-6 sm:gap-12 mt-12 sm:mt-20 w-full justify-center">
          <Button 
            onClick={handlePrev} 
            disabled={currentCardIndex === 0}
            className={`w-32 sm:w-40 border-[3px] border-sumi bg-kinari text-sumi font-bold uppercase tracking-widest text-[10px] sm:text-xs shadow-[4px_4px_0_0_#1a1a1a] rounded-none ${currentCardIndex === 0 ? 'opacity-30 cursor-not-allowed shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none' : 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a]'}`}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={currentCardIndex === rowKana.length - 1}
            className={`w-32 sm:w-40 border-[3px] border-sumi bg-sumi text-kinari-light font-bold uppercase tracking-widest text-[10px] sm:text-xs shadow-[4px_4px_0_0_#1a1a1a] rounded-none ${currentCardIndex === rowKana.length - 1 ? 'opacity-30 cursor-not-allowed shadow-none hover:translate-x-0 hover:translate-y-0 hover:shadow-none' : 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light'}`}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
