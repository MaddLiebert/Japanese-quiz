import { getNotes } from "./notes";

// Panel penjelasan bahasa Indonesia untuk feedback kuis / kartu belajar.
// Mengembalikan null kalau item belum punya catatan — aman dipasang di mana saja.
export function NotesPanel({ item, language, className = "" }) {
  const notes = getNotes(item);
  if (language !== 'id' || !notes) return null;

  return (
    <div className={`w-full max-w-lg border-[3px] border-sumi/20 bg-kinari p-4 text-left ${className}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-sumi/40 mb-2">
        {item.type === 'kanji' ? 'Kegunaan' : 'Penjelasan'}
      </div>
      <p className="text-[13px] leading-relaxed text-sumi/80">{notes.desc}</p>

      {notes.pola && (
        <div className="mt-3 border-[2px] border-sumi/20 bg-kinari-light px-3 py-2">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-sumi/40 mr-2">Pola</span>
          <span className="text-[13px] font-bold text-sumi">{notes.pola}</span>
        </div>
      )}

      {notes.ex?.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-sumi/40">Contoh</div>
          {notes.ex.map((e, i) => (
            <div key={i} className="border-l-[3px] border-ai/40 pl-2">
              <p className="text-[13px] font-serif text-sumi leading-snug">{e.w}</p>
              <p className="text-[10px] text-sumi/50 italic">{e.k}</p>
              <p className="text-[11px] text-sumi/70">{e.m}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
