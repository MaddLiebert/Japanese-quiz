import kanjiNotes from "../../data/kanjiNotes.json";
import grammarNotes from "../../data/grammarNotes.json";

const NOTES = { ...kanjiNotes, ...grammarNotes };

// Penjelasan bahasa Indonesia untuk satu kartu (kanji / partikel / pola kalimat).
// null kalau item belum punya catatan — pemanggil wajib cek sebelum render.
export function getNotes(item) {
  if (!item?.id) return null;
  const n = NOTES[item.id];
  return n && n.desc ? n : null;
}
