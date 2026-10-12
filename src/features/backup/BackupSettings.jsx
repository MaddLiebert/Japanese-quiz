import { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  buildBackup, serializeBackup, parseBackup, backupSummary, applyBackup,
} from './backup';

// 引っ越し — kartu "Cadangkan & Pindahkan Data" untuk halaman Pengaturan.
// Ekspor progres ke file JSON → impor di domain/perangkat lain.
// (localStorage terikat origin; kalau app pindah domain, data harus dipindah manual.)
export function BackupSettings() {
  const { language } = useLanguage();
  const id = language === 'id';
  const fileRef = useRef(null);
  const [note, setNote] = useState(null);
  const [pending, setPending] = useState(null); // { backup, summary }
  const [fillOnly, setFillOnly] = useState(false);

  const origin = typeof location !== 'undefined' ? location.origin : '';
  const current = backupSummary(buildBackup());

  const flash = (ok, msg) => setNote({ ok, msg });

  // ── Ekspor ────────────────────────────────────────────────────────────────
  const doExport = () => {
    try {
      const text = serializeBackup(buildBackup());
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nihongo-gakuen-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash(true, id ? 'File backup terunduh. Simpan baik-baik.' : 'Backup file downloaded. Keep it safe.');
    } catch (e) {
      flash(false, String(e?.message || e));
    }
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(serializeBackup(buildBackup()));
      flash(true, id ? 'Data disalin ke clipboard.' : 'Data copied to clipboard.');
    } catch {
      flash(false, id ? 'Gagal menyalin (izin clipboard ditolak).' : 'Copy failed (clipboard denied).');
    }
  };

  // ── Impor ─────────────────────────────────────────────────────────────────
  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // izinkan pilih file sama dua kali
    if (!file) return;
    try {
      const text = await file.text();
      const r = parseBackup(text);
      if (!r.ok) {
        flash(false, id ? `File tidak valid (${r.error}).` : `Invalid file (${r.error}).`);
        return;
      }
      setPending({ backup: r.backup, summary: backupSummary(r.backup) });
      flash(null, null);
    } catch (err) {
      flash(false, String(err?.message || err));
    }
  };

  const doImport = () => {
    if (!pending) return;
    const msg = id
      ? `Impor data dari backup?\n\nNama: ${pending.summary.username || '—'}\nXP: ${pending.summary.xp} · Level: ${pending.summary.level}\n\n${fillOnly ? 'Hanya mengisi data yang kosong.' : 'Data saat ini akan DITIMPA.'}\n\nHalaman akan dimuat ulang setelah impor.`
      : `Import data from backup?\n\nName: ${pending.summary.username || '—'}\nXP: ${pending.summary.xp} · Level: ${pending.summary.level}\n\n${fillOnly ? 'Only fills empty data.' : 'Current data will be OVERWRITTEN.'}\n\nThe page will reload after import.`;
    if (!window.confirm(msg)) return;
    const n = applyBackup(localStorage, pending.backup, fillOnly ? 'fill' : 'overwrite');
    flash(true, id ? `${n} data dipulihkan. Memuat ulang…` : `${n} entries restored. Reloading…`);
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="border-[3px] border-sumi/20 bg-kinari p-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <label className="block text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60">
          {id ? 'Cadangkan & Pindahkan Data' : 'Backup & Move Data'}
        </label>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/50">引っ越し</span>
      </div>
      <p className="text-xs text-sumi/70 font-semibold mb-4">
        {id
          ? 'Simpan progres ke satu file, lalu pulihkan di domain atau perangkat lain. Berguna kalau app pindah alamat (data lokal terikat alamat).'
          : 'Save your progress to a single file, then restore it on another domain or device. Useful when the app moves address (local data is tied to the address).'}
      </p>

      {/* Ringkasan data saat ini */}
      <div className="border-[3px] border-sumi/20 bg-kinari-light px-4 py-3 mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/50 block">{id ? 'Nama' : 'Name'}</span>
            <span className="text-sm font-black text-sumi truncate block">{current.username || '—'}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/50 block">XP</span>
            <span className="text-sm font-black text-sumi tabular-nums block">{current.xp}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/50 block">Level</span>
            <span className="text-sm font-black text-sumi tabular-nums block">{current.level}</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-sumi/40 mt-3 break-all">
          {id ? 'Alamat saat ini' : 'Current address'}: {origin || '—'}
        </p>
      </div>

      {/* Tombol ekspor */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={doExport}
          className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-ai text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
        >
          {id ? 'Ekspor ke File' : 'Export to File'}
        </button>
        <button
          type="button"
          onClick={doCopy}
          className="py-3 px-5 border-[3px] border-sumi/40 font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi/70 hover:text-sumi transition-all cursor-pointer"
        >
          {id ? 'Salin ke Clipboard' : 'Copy to Clipboard'}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="py-3 px-5 border-[3px] border-sumi font-bold text-xs uppercase tracking-widest bg-kinari-light text-sumi shadow-[3px_3px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all cursor-pointer"
        >
          {id ? 'Impor dari File' : 'Import from File'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onPickFile}
          className="hidden"
        />
      </div>

      {/* Pratinjau impor + opsi mode */}
      {pending && (
        <div className="mt-4 border-[3px] border-ai/50 bg-kinari-light p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-sumi/60 mb-2">
            {id ? 'Siap diimpor' : 'Ready to import'}
          </p>
          <p className="text-xs font-bold text-sumi">
            {pending.summary.username || '—'} · XP {pending.summary.xp} · Level {pending.summary.level}
            {pending.summary.exportedAt ? ` · ${new Date(pending.summary.exportedAt).toLocaleDateString()}` : ''}
          </p>
          {pending.summary.origin && (
            <p className="text-[10px] font-bold text-sumi/40 mt-1 break-all">
              {id ? 'Dari' : 'From'}: {pending.summary.origin}
            </p>
          )}
          <label className="flex items-center gap-2 mt-3 text-[11px] font-bold text-sumi/70 cursor-pointer">
            <input
              type="checkbox"
              checked={fillOnly}
              onChange={(e) => setFillOnly(e.target.checked)}
              className="w-4 h-4 accent-ai"
            />
            {id ? 'Jangan timpa — isi yang kosong saja' : "Don't overwrite — fill empty only"}
          </label>
          <div className="flex flex-wrap gap-3 mt-3">
            <button
              type="button"
              onClick={doImport}
              className="py-2.5 px-4 border-[3px] border-sumi font-bold text-[11px] uppercase tracking-widest bg-shu text-kinari-light shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
            >
              {id ? 'Terapkan Impor' : 'Apply Import'}
            </button>
            <button
              type="button"
              onClick={() => { setPending(null); flash(null, null); }}
              className="py-2.5 px-4 border-[3px] border-sumi/40 font-bold text-[11px] uppercase tracking-widest bg-kinari-light text-sumi/60 hover:text-sumi transition-all cursor-pointer"
            >
              {id ? 'Batal' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {note?.msg && (
        <p className={`text-[11px] font-bold mt-4 ${note.ok ? 'text-ai' : 'text-shu'}`}>{note.msg}</p>
      )}

      <p className="text-[10px] font-bold text-sumi/40 mt-4 leading-relaxed">
        {id
          ? 'File backup berisi nama, progres, pencapaian, koleksi, dan pengaturan. TIDAK berisi sandi/token akun — aman disimpan sendiri.'
          : 'The backup file holds your name, progress, achievements, collection, and settings. It does NOT contain account passwords/tokens — safe to keep yourself.'}
      </p>
    </div>
  );
}

export default BackupSettings;
