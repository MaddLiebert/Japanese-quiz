export function KanaTypeToggle({ active, onChange }) {
  const tabs = [
    { id: 'hiragana', label: 'Hiragana', jp: 'ひらがな' },
    { id: 'katakana', label: 'Katakana', jp: 'カタカナ' },
    { id: 'kotoba', label: 'Kotoba', jp: '言葉' },
    { id: 'kanji', label: 'Kanji', jp: '漢字' },
    { id: 'grammar', label: 'Grammar', jp: '文法' },
    { id: 'kurikulum', label: 'Kurikulum MNN', jp: 'カリキュラム' },
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
