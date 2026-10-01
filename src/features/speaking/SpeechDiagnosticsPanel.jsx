// SpeechDiagnosticsPanel.jsx — panel diagnosa OPT-IN di halaman Speaking.
// Tujuan: user menekan "Cek Mikrofon", bicara sekali, lalu COPY laporan ke
// developer. Menjawab "salah website / Google / HP?" dengan bukti, bukan tebakan.
import React, { useState } from 'react';
import { useSpeechDiagnostics } from './useSpeechDiagnostics';
import { useLanguage } from '../../context/LanguageContext';

const LEVEL_CLASS = {
  ok: 'border-matcha text-matcha',
  warn: 'border-shu text-shu',
  blocker: 'border-shu text-shu',
};

export function SpeechDiagnosticsPanel() {
  const { language } = useLanguage();
  const id = language === 'id';
  const [open, setOpen] = useState(false);
  const { env, micTest, testMic, clear, report, summary } = useSpeechDiagnostics();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="speech-diag-open"
        className="mb-6 px-4 py-2 bg-kinari border-[3px] border-sumi text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_#1a1a1a]"
      >
        {id ? '🔍 Diagnosa suara' : '🔍 Voice diagnostics'}
      </button>
    );
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(report()); } catch { /* noop */ }
  };

  return (
    <div data-testid="speech-diag-panel" className="mb-6 border-[3px] border-sumi bg-kinari p-4 text-xs font-bold text-sumi">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest">{id ? 'Diagnosa suara' : 'Voice diagnostics'}</span>
        <span className="flex-grow" />
        <button type="button" onClick={() => setOpen(false)} className="px-2 py-1 border-[2px] border-sumi text-[10px] uppercase">
          {id ? 'Tutup' : 'Close'}
        </button>
      </div>

      {env && (
        <p className={`mb-2 px-3 py-2 border-[2px] ${LEVEL_CLASS[env.level] || 'border-sumi'}`}>
          {id ? 'Lingkungan' : 'Environment'}: {id ? env.message.id : env.message.en} ({env.code})
        </p>
      )}

      <p className="mb-3">
        {id ? 'Mikrofon' : 'Microphone'}: {micTest || '—'}{' '}
        <button
          type="button"
          onClick={testMic}
          data-testid="speech-diag-mictest"
          className="ml-2 px-3 py-1 bg-ai text-kinari-light border-[2px] border-sumi text-[10px] uppercase tracking-widest"
        >
          {id ? 'Cek Mikrofon' : 'Test mic'}
        </button>
      </p>

      <p className="mb-3">
        {id ? 'Hasil' : 'Verdict'}: <b>{summary.code}</b> · events: {JSON.stringify(summary.counts)}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          data-testid="speech-diag-copy"
          className="px-3 py-1 bg-matcha text-kinari-light border-[2px] border-sumi text-[10px] uppercase tracking-widest"
        >
          {id ? 'Copy laporan' : 'Copy report'}
        </button>
        <button type="button" onClick={clear} className="px-3 py-1 bg-kinari border-[2px] border-sumi text-[10px] uppercase tracking-widest">
          {id ? 'Reset' : 'Reset'}
        </button>
      </div>

      <pre data-testid="speech-diag-report" className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] font-mono bg-sumi/5 p-2">
        {report()}
      </pre>
    </div>
  );
}

export default SpeechDiagnosticsPanel;
