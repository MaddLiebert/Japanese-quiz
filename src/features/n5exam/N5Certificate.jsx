import { motion } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";
import { gradeLabel, certificateNo, n5BadgesFor, N5_YUUSHUU_MIN, N5_KANPEKI_TOTAL } from "./certificate";
import { N5_PASS_TOTAL, N5_PASS_LKR, N5_PASS_LISTENING, LKR_MAX, LISTENING_MAX } from "./n5exam";
import { badgeCircleClass } from "../progress/badgeSeal";
import { LegendaryDecor } from "../progress/BadgeDecor";

// Stempel hanko merah untuk badge kelulusan (合/優/満).
const Stamp = ({ label, title, on, delay = 0, legendary = false }) => (
  <motion.div
    initial={{ scale: 1.6, opacity: 0, rotate: 12 }}
    animate={{ scale: 1, opacity: 1, rotate: -5 }}
    transition={{ type: "spring", stiffness: 150, damping: 10, delay }}
    className={`flex flex-col items-center gap-2 ${on ? '' : 'opacity-25 grayscale'}`}
  >
    <div className={`relative w-16 h-16 rounded-full text-shu flex items-center justify-center bg-kinari-light ${legendary && on ? badgeCircleClass('n5_kanpeki').replace('border-[5px]', 'border-[4px]') : 'border-[4px] border-shu'}`}>
      <div className="absolute inset-0 border-[2px] border-current opacity-60 m-1 rounded-full"></div>
      {legendary && on && <LegendaryDecor />}
      <span className="text-2xl font-serif font-black leading-none z-10">{label}</span>
    </div>
    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sumi/60">{title}</span>
  </motion.div>
);

// Format tanggal (ISO → lokal singkat).
const fmtDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export function N5Certificate({ record, username = '' }) {
  const { language } = useLanguage();
  const id = language === 'id';
  const passed = !!record?.passed;

  if (!passed) {
    return (
      <div className="border-[4px] border-sumi bg-kinari p-8 sm:p-12 text-center shadow-[6px_6px_0_0_#1a1a1a]">
        <div className="text-6xl font-serif font-black text-sumi/20 mb-4">合格証書</div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sumi/60 mb-2">
          {id ? 'Sertifikat Belum Terbit' : 'Certificate Not Issued'}
        </p>
        <p className="text-xs font-bold text-sumi/50 max-w-md mx-auto leading-relaxed">
          {id
            ? `Ikuti Ujian N5 模擬試験 dan capai skor total ≥${N5_PASS_TOTAL}/180 (plus sectional ≥${N5_PASS_LKR}/120 & ≥${N5_PASS_LISTENING}/60) untuk membuka sertifikat kelulusan.`
            : `Take the N5 模擬試験 and score ≥${N5_PASS_TOTAL}/180 (plus sectional ≥${N5_PASS_LKR}/120 & ≥${N5_PASS_LISTENING}/60) to unlock the certificate.`}
        </p>
      </div>
    );
  }

  const grade = gradeLabel(record, id ? 'id' : 'en');
  const certNo = certificateNo(record, username);
  const badges = n5BadgesFor(record);
  const issued = fmtDate(record.passedAt);

  return (
    <div className="space-y-4">
      {/* Kartu sertifikat — diberi kelas print:cert agar rapi saat dicetak */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[6px] border-sumi bg-kinari-light shadow-[10px_10px_0_0_rgba(26,26,26,0.15)] relative overflow-hidden print-cert"
      >
        {/* Bingkai ganda ala sertifikat */}
        <div className="absolute inset-2 border-[2px] border-shu/40 pointer-events-none"></div>
        <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 text-[16rem] font-serif text-shu opacity-[0.05] pointer-events-none select-none leading-none">合</div>

        <div className="relative z-10 p-6 sm:p-12 text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] font-black text-sumi/50">
            {id ? 'Sertifikat Kelulusan' : 'Certificate of Achievement'}
          </div>
          <h2 className="text-4xl sm:text-6xl font-serif font-black text-sumi tracking-tight mt-2 mb-1">合格証書</h2>
          <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-shu mb-8">
            日本語能力試験 N5 模擬試験
          </div>

          {/* Nama */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.3em] font-black text-sumi/50 mb-1">{id ? 'Nama' : 'Name'}</div>
            <div className="text-2xl sm:text-4xl font-serif font-black text-sumi border-b-[3px] border-sumi inline-block px-6 pb-2">
              {username || (id ? 'Anonim' : 'Anonymous')}
            </div>
          </div>

          <p className="text-xs sm:text-sm font-bold text-sumi/70 max-w-lg mx-auto leading-relaxed mb-8">
            {id
              ? 'Telah dinyatakan LULUS dalam ujian tiruan JLPT N5 dengan hasil sebagai berikut:'
              : 'has PASSED the JLPT N5 mock examination with the following results:'}
          </p>

          {/* Skor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8 text-left">
            <div className="border-[3px] border-sumi bg-kinari px-4 py-3">
              <div className="text-[9px] uppercase tracking-[0.2em] font-black text-sumi/50">{id ? 'Tata Bahasa・Membaca' : 'Grammar・Reading'}</div>
              <div className="text-xl font-serif font-black text-sumi">{record.bestLkr} <span className="text-sm text-sumi/40">/ {LKR_MAX}</span></div>
            </div>
            <div className="border-[3px] border-sumi bg-kinari px-4 py-3">
              <div className="text-[9px] uppercase tracking-[0.2em] font-black text-sumi/50">{id ? 'Menyimak' : 'Listening'}</div>
              <div className="text-xl font-serif font-black text-sumi">{record.bestListening} <span className="text-sm text-sumi/40">/ {LISTENING_MAX}</span></div>
            </div>
            <div className="border-[3px] border-shu bg-shu/5 px-4 py-3">
              <div className="text-[9px] uppercase tracking-[0.2em] font-black text-shu/70">{id ? 'Total' : 'Total'}</div>
              <div className="text-xl font-serif font-black text-shu">{record.bestTotal} <span className="text-sm text-shu/40">/ 180</span></div>
            </div>
          </div>

          {/* Stempel badge */}
          <div className="flex items-end justify-center gap-8 mb-8">
            <Stamp label="合" title="合格" on={badges.includes('n5_gokaku')} delay={0.1} />
            <Stamp label="優" title="優良" on={badges.includes('n5_yuushuu')} delay={0.2} />
            <Stamp label="満" title="満点" on={badges.includes('n5_kanpeki')} delay={0.3} legendary />
          </div>

          {/* Footer: nomor + tanggal + grade */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t-[3px] border-sumi/20 pt-5 max-w-2xl mx-auto">
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-[0.2em] font-black text-sumi/50">{id ? 'No. Sertifikat' : 'Certificate No.'}</div>
              <div className="text-sm font-mono font-bold text-sumi">{certNo}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[0.2em] font-black text-sumi/50">{id ? 'Predikat' : 'Grade'}</div>
              <div className="text-sm font-serif font-black text-shu">{grade}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.2em] font-black text-sumi/50">{id ? 'Tanggal' : 'Date'}</div>
              <div className="text-sm font-bold text-sumi">{issued}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer kejujuran: ini fiktif, bukan sertifikat resmi JLPT */}
      <p className="text-[10px] text-sumi/40 font-bold uppercase tracking-widest text-center px-4">
        {id
          ? 'Catatan: Sertifikat ini fiktif untuk dalam aplikasi — BUKAN sertifikat JLPT resmi.'
          : 'Note: In-app fictional certificate — NOT an official JLPT certificate.'}
      </p>

      <div className="flex justify-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 border-[4px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-[0.25em] text-xs shadow-[5px_5px_0_0_#1a1a1a] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer"
        >
          {id ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}
        </button>
      </div>

      {/* Info ambang predikat */}
      <div className="text-[10px] text-sumi/50 font-bold text-center">
        {id ? 'Predikat: 合格 (lulus) · 優良 (≥' : 'Grades: 合格 (pass) · 優良 (≥'}{N5_YUUSHUU_MIN}{id ? ') · 満点 (' : ') · 満点 ('}{N5_KANPEKI_TOTAL}/180)
      </div>
    </div>
  );
}
