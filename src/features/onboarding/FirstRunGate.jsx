import { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { useUserStats } from '../progress/ProgressContext';
import { useSync } from '../sync/SyncContext';
import { AuthModal } from '../sync/AuthModal';
import { Glyph } from '../../components/icons/Glyph';
import { Button } from '../../components/ui/Button';
import { AUTH_METHODS, firstRunStep, advanceAfterMethod, methodCopy } from './firstRun';

// ── Gerbang "pertama kali buka app" ─────────────────────────────────────────
// Keputusan pemilik (2026-10-14): user baru MEMILIH cara masuk DULU
// (Tanpa Akun / Email / Google), nama panggilan ditanya BELAKANGAN.
//
// Alur:
//   step 'method' → kartu pilihan cara masuk
//     • Tanpa Akun → enableSync() (tamu per-device) → lanjut ke 'name'
//     • Email      → buka AuthModal → setelah masuk (isSignedIn) → 'name'
//     • Google     → tampil TAPI mati (butuh setup Google Cloud; ditunda user)
//   step 'name'   → form nama panggilan → setUsername → gate selesai
//
// Gate TIDAK muncul lagi setelah nama terisi (username tersimpan di
// localStorage 'username'), jadi user lama tak terganggu.
export function FirstRunGate() {
  const { language } = useLanguage();
  const id = language === 'id';
  const { username, setUsername } = useUserStats();
  const { isSignedIn, enableSync } = useSync();

  const [step, setStep] = useState(null);       // null | 'method' | 'email' | 'name'
  const [inputName, setInputName] = useState('');
  const [busy, setBusy] = useState(false);

  // Langkah wajib dari state (sumber tunggal, lihat firstRun.js).
  const required = firstRunStep({ username, isSignedIn });

  // Selesai (nama sudah ada) → gate TUTUP, apa pun state lokalnya.
  if (!required) return null;

  // Sudah masuk (mis. balik dari tautan email) tapi nama belum ada → form nama.
  // Selain itu, hormati pilihan lokal: 'name' (Tamu), 'email' (popup), else kartu.
  const active = required === 'name' ? 'name' : (step || 'method');

  const pick = async (m) => {
    const next = advanceAfterMethod(m.id);
    if (next === 'name') {
      // Tanpa Akun: aktifkan sesi tamu (kalau backend siap), lalu tanya nama.
      if (m.id === 'guest') {
        setBusy(true);
        try { await enableSync(); } catch { /* offline: tetap lanjut, progres lokal */ }
        setBusy(false);
      }
      setStep('name');
    } else {
      setStep('email');
    }
  };

  // ── Langkah 2: nama panggilan ─────────────────────────────────────────────
  if (active === 'name') {
    return (
      <Shell>
        <Header kanji="名" title={id ? 'Siapa Namamu?' : "What's Your Name?"}
          sub={id ? 'Nama ini muncul di papan peringkat' : 'Shown on the leaderboard'} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputName.trim()) setUsername(inputName.trim());
          }}
          className="flex flex-col gap-4"
        >
          <input
            type="text" required value={inputName} autoFocus
            onChange={(e) => setInputName(e.target.value)}
            placeholder={id ? 'Masukkan nama panggilan…' : 'Enter your nickname…'}
            className="w-full border-[3px] border-sumi bg-kinari px-4 py-3 text-sm font-bold text-sumi placeholder:text-sumi/40 focus:outline-none focus:bg-kinari-light transition-colors"
          />
          <Button
            type="submit"
            className="w-full bg-ai text-kinari-light rounded-none border-[3px] border-sumi text-xs py-3.5 uppercase font-bold tracking-widest shadow-[4px_4px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {id ? 'Mulai Belajar' : 'Start Learning'}
          </Button>
          <Button
            type="button"
            onClick={() => setUsername('Guest')}
            className="w-full bg-kinari text-sumi rounded-none border-[3px] border-sumi text-xs py-3 uppercase font-bold tracking-widest shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {id ? 'Lewati (Tamu)' : 'Skip (Guest)'}
          </Button>
        </form>
      </Shell>
    );
  }

  // ── Langkah 1: pilih cara masuk ───────────────────────────────────────────
  return (
    <Shell wide>
      <Header kanji="入" title={id ? 'Selamat Datang' : 'Welcome'}
        sub={id ? 'Pilih cara masuk — bisa diubah kapan saja' : 'Choose how to start — changeable anytime'} />

      <div className="flex flex-col gap-3">
        {AUTH_METHODS.map((m) => {
          const c = methodCopy(m.id, language);
          const disabled = !m.enabled || busy;
          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => pick(m)}
              className={`group flex items-center gap-4 text-left border-[3px] border-sumi px-4 py-3.5 transition-all ${
                disabled
                  ? 'bg-kinari/60 text-sumi/40 cursor-not-allowed'
                  : 'bg-kinari-light text-sumi shadow-[4px_4px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer'
              }`}
            >
              <span className={`w-11 h-11 shrink-0 flex items-center justify-center font-serif text-2xl font-black border-[3px] ${
                disabled ? 'border-sumi/20 bg-kinari' : 'border-sumi bg-sumi text-kinari-light'
              }`}>
                {m.kanji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <Glyph name={m.glyph} className={disabled ? '' : 'text-shu'} />
                  <span className="font-black text-sm uppercase tracking-wide">{c.title}</span>
                  {!m.enabled && (
                    <span className="text-[9px] uppercase tracking-widest font-bold border-[2px] border-sumi/30 px-1.5 py-0.5">
                      {id ? 'Segera' : 'Soon'}
                    </span>
                  )}
                </span>
                <span className="block text-[11px] font-semibold text-sumi/60 mt-1 leading-relaxed">
                  {c.desc}
                </span>
              </span>
              {!disabled && <span className="shrink-0 text-lg font-black text-sumi/30 group-hover:text-sumi">→</span>}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-sumi/45 font-semibold mt-5 leading-relaxed text-center">
        {id
          ? 'Progresmu tersimpan otomatis. Bikin akun kapan saja dari Pengaturan.'
          : 'Your progress is saved automatically. Create an account anytime from Settings.'}
      </p>

      {/* Pilih Email → buka popup Masuk/Daftar. Setelah berhasil masuk,
          `isSignedIn` jadi true → langkah otomatis pindah ke form nama. */}
      <AuthModal
        open={active === 'email'}
        onClose={() => setStep('method')}
        initialTab="signin"
      />
    </Shell>
  );
}

// ── Kerangka visual (neo-brutalis, sama seperti modal app) ───────────────────
function Shell({ children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[200] bg-kinari flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'} border-[4px] border-sumi bg-kinari-light p-7 sm:p-8 shadow-[8px_8px_0_0_#1a1a1a] relative ink-edge max-h-[92vh] overflow-y-auto`}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Header({ kanji, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-sumi text-kinari-light flex items-center justify-center font-serif text-xl font-black">
        {kanji}
      </div>
      <div>
        <h3 className="text-xl font-serif font-black text-sumi">{title}</h3>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/60">{sub}</p>
      </div>
    </div>
  );
}

export default FirstRunGate;
