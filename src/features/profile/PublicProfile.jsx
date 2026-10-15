// PublicProfile.jsx — halaman /u/:id (docs/public-profile.md §7 +
// docs/public-profile-full.md §7). Read-only, bisa dibagikan.
//
// Dua tingkat:
//   • DASAR  — avatar, nama, rank, Lv, XP, streak, akurasi (kalau is_public).
//   • LENGKAP — tab Ringkasan/Statistik/Sertifikat: winrate, penguasaan materi
//     (radar 8 subjek), badge terpasang, dan sertifikat N5. Hanya muncul kalau
//     pemilik menyalakan 「Profil Lengkap」 (server kirim `row.full`).
//
// Data dari RPC ber-whitelist `public_profile(uuid)`. Kembalian kosong =
// privat / tidak ada → kartu 「非公開」 (sengaja tidak dibedakan).
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { goBackOr } from './backNav.js';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { EraPaper } from '../../components/EraPaper';
import { Glyph } from '../../components/icons/Glyph';
import { RankBadge } from '../progress/RankBadge';
import { ACHIEVEMENT_META } from '../progress/ProgressContext';
import { N5Certificate } from '../n5exam/N5Certificate';
import { localized } from '../../utils/localize';
import { initials } from './avatar';
import { fetchPublicProfile } from '../leaderboard/leaderboardApi';
import { fetchPlayerCard } from '../social/socialApi';
import { FollowButton } from '../social/FollowButton.jsx';
import { copyText } from '../leaderboard/PublicProfileModal';
import { profileErrorCopy } from '../leaderboard/profileError';
import { SUBJECT_LABEL_ID } from './subjectMastery';
import { buildPublicMastery, fullStats, hasCertificate, publicBadgeList, hasFullProfile } from './publicProfileView';
import hiraganaData from '../../data/hiragana.json';
import katakanaData from '../../data/katakana.json';
import kotobaData from '../../data/kotoba.json';
import grammarData from '../../data/grammar.json';
import kanjiData from '../../data/kanji.json';
import mondaiData from '../../data/mondai.json';
import poemsData from '../../data/poems.json';
import n5ExamData from '../../data/n5-exam.json';

// Dataset untuk radar penguasaan materi (8 subjek) — sama seperti Profil sendiri.
const MASTERY_DATASETS = {
  hiragana: hiraganaData,
  katakana: katakanaData,
  kanji: kanjiData,
  kotoba: kotobaData,
  grammar: grammarData,
  mondai: mondaiData,
  poems: poemsData,
  n5exam: Object.values(n5ExamData || {}).flat().filter((it) => it && it.id),
};

export function PublicProfile() {
  const { id: targetId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const id = language === 'id';

  const [state, setState] = useState({ loading: true, row: null, error: null });
  const [copied, setCopied] = useState(false);
  // Kartu minimal (nama/avatar/level + rel_state) — untuk tombol 友達, dan
  // untuk kasus profil privat supaya halaman tetap "siapa ini" + tombol minta.
  const [card, setCard] = useState(null);
  const [tab, setTab] = useState('ringkasan'); // ringkasan | statistik | sertifikat

  useEffect(() => {
    if (!targetId) { setState({ loading: false, row: null, error: null }); return; }
    let alive = true;
    setState({ loading: true, row: null, error: null });
    setCard(null);
    setTab('ringkasan');
    fetchPublicProfile(targetId)
      .then(({ row, error }) => { if (alive) setState({ loading: false, row, error }); })
      .catch((e) => { if (alive) setState({ loading: false, row: null, error: String(e?.message || e) }); });
    fetchPlayerCard(targetId)
      .then(({ row }) => { if (alive) setCard(row); })
      .catch(() => { /* offline → tanpa tombol */ });
    return () => { alive = false; };
  }, [targetId]);

  const refreshCard = () => {
    if (!targetId) return;
    fetchPlayerCard(targetId, { force: true })
      .then(({ row }) => setCard(row))
      .catch(() => { /* noop */ });
  };

  const { loading, row, error } = state;
  const name = row?.display_name || '旅人';
  const full = hasFullProfile(row) ? row.full_data : null;
  const stats = useMemo(() => fullStats(full), [full]);
  const radar = useMemo(
    () => (full ? buildPublicMastery(full.itemStatus, MASTERY_DATASETS) : []),
    [full],
  );
  const badges = useMemo(() => (full ? publicBadgeList(full) : []), [full]);

  const handleCopy = async () => {
    const ok = await copyText(typeof location !== 'undefined' ? location.href : '');
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const tabs = [
    { k: 'ringkasan', jp: '概要', label: id ? 'Ringkasan' : 'Summary', glyph: 'idcard' },
    { k: 'statistik', jp: '統計', label: id ? 'Statistik' : 'Statistics', glyph: 'chart' },
    { k: 'sertifikat', jp: '合格証書', label: id ? 'Sertifikat' : 'Certificate', glyph: 'trophy' },
  ];

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16 min-h-screen">
      <EraPaper />
      <button
        onClick={() => goBackOr(navigate, '/leaderboard')}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-kinari-light border-[3px] border-sumi font-black uppercase text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#1a1a1a] transition-all cursor-pointer"
      >
        ← {id ? 'Papan Peringkat' : 'Leaderboard'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="border-[4px] border-sumi bg-kinari-light relative overflow-hidden shadow-[12px_12px_0_0_rgba(26,26,26,0.1)]"
      >
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/4 text-[22rem] font-serif text-sumi opacity-[0.03] pointer-events-none select-none leading-none z-0">
          者
        </div>

        <header className="grid grid-cols-1 sm:grid-cols-12 border-b-[4px] border-sumi relative z-10 bg-seigaiha">
          <div className="sm:col-span-8 p-6 sm:p-10 relative">
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 bg-sumi text-kinari-light flex items-center justify-center font-serif text-2xl rotate-3 shadow-[4px_4px_0_0_#d3382f]">
                訪
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.4em] font-bold text-sumi">
                  {id ? 'Profil Pemain' : 'Player Profile'}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-black text-sumi tracking-tighter mt-1">
                  プロフィール
                </h1>
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-sumi/50 relative z-10">
              {full
                ? (id ? 'Profil lengkap — bisa dibagikan' : 'Full profile — shareable')
                : (id ? 'Halaman publik — bisa dibagikan' : 'Public page — shareable')}
            </p>
          </div>
          <div className="sm:col-span-4 p-6 flex flex-col items-center justify-center bg-kinari border-t-[4px] sm:border-t-0 sm:border-l-[4px] border-sumi">
            <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.3em] text-sumi/40">訪問</div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/50 mb-1">
              {id ? 'Rank' : 'Rank'}
            </span>
            {row
              ? <RankBadge xp={row.xp} variant="hero" />
              : <div className="w-24 h-24 border-[4px] border-dashed border-sumi/20 flex items-center justify-center text-sumi/30 font-serif text-3xl">—</div>}
          </div>
        </header>

        {/* Tab — hanya muncul saat profil LENGKAP terbuka. */}
        {!loading && !error && row && full && (
          <div className="grid grid-cols-3 border-b-[4px] border-sumi bg-kinari">
            {tabs.map((t, i) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`py-4 px-2 sm:px-6 font-serif font-black uppercase text-[10px] sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  i < tabs.length - 1 ? 'border-r-[4px] border-sumi' : ''
                } ${tab === t.k ? 'bg-shu text-kinari-light shadow-inner' : 'bg-kinari-light text-sumi hover:bg-kinari'}`}
              >
                <Glyph name={t.glyph} className="mr-1" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="font-serif">{t.jp}</span>
              </button>
            ))}
          </div>
        )}

        <div className="p-6 sm:p-12 relative z-10 bg-kinari-light">
          {loading ? (
            <p className="text-sm font-bold text-sumi/50 py-16 text-center">{id ? 'Memuat…' : 'Loading…'}</p>
          ) : error ? (
            <div className="border-[4px] border-shu/40 bg-kinari p-8 sm:p-10 text-center">
              <p className="text-sm font-bold text-shu">{profileErrorCopy(error, language).title}</p>
              <p className="text-[11px] text-sumi/60 mt-2 max-w-sm mx-auto leading-relaxed">
                {profileErrorCopy(error, language).hint}
              </p>
            </div>
          ) : !targetId || !row ? (
            // Privat / tidak ada / id kosong — kartu 「非公開」 (+ tombol 友達 bila
            // kartu minimal tersedia, supaya bisa minta pertemanan).
            <div className="border-[4px] border-sumi bg-kinari p-8 sm:p-12 text-center shadow-[6px_6px_0_0_#1a1a1a]">
              <div className="mx-auto w-20 h-20 border-[3px] border-dashed border-sumi/30 flex items-center justify-center mb-5">
                {card?.avatar
                  ? <img src={card.avatar} alt="" className="w-full h-full object-cover" />
                  : <Glyph name="lock" className="text-3xl text-sumi/40" />}
              </div>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-sumi">
                {card?.display_name || 'プロフィールは非公開'}
              </h2>
              <p className="text-sm font-bold text-sumi/70 mt-2">{id ? 'Profil ini privat' : 'This profile is private'}</p>
              {card && card.state !== 'self' && (
                <div className="mt-6 flex justify-center">
                  <FollowButton
                    targetId={card.id}
                    state={card.state}
                    isPublic={false}
                    onChanged={refreshCard}
                  />
                </div>
              )}
              <p className="text-xs text-sumi/50 mt-5 max-w-sm mx-auto leading-relaxed">
                {card
                  ? (id
                      ? 'Statistiknya tersembunyi. Minta pertemanan — setelah dia terima, kalian saling terhubung.'
                      : 'Their stats are hidden. Send a friend request — once accepted, you are connected.')
                  : (id
                      ? 'Pemain ini belum menyalakan 「Profil Publik」. Minta dia menyalakannya di Pengaturan agar halaman ini bisa dilihat.'
                      : 'This player has not turned on 「Public Profile」. Ask them to enable it in Settings so this page becomes visible.')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kartu ringkas (read-only) — selalu tampil */}
              <div className="border-[4px] border-sumi bg-kinari p-6 shadow-[6px_6px_0_0_#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 shrink-0 border-[4px] border-sumi bg-ai text-kinari-light flex items-center justify-center overflow-hidden font-serif font-black text-2xl shadow-[4px_4px_0_0_#1a1a1a]">
                  {row.avatar
                    ? <img src={row.avatar} alt="" className="w-full h-full object-cover" />
                    : initials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-sumi/60">
                    {id ? 'Nama' : 'Name'}
                  </span>
                  <h2 className="text-3xl font-serif font-black text-sumi truncate">{name}</h2>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <RankBadge xp={row.xp} variant="chip" />
                    <span className="border-[2px] border-sumi bg-kinari px-2.5 py-1 text-xs font-black text-sumi">
                      Lv {row.level}
                    </span>
                    {full && (
                      <span className="border-[2px] border-shu bg-shu/10 text-shu px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                        プロフィール完全
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-sumi/60">Total XP</div>
                  <div className="text-2xl font-serif font-black text-sumi">{Number(row.xp || 0).toLocaleString()} XP</div>
                </div>
              </div>

              {/* ── DASAR saja (belum menyalakan Profil Lengkap) ── */}
              {!full && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'XP', value: Number(row.xp || 0).toLocaleString(), cls: 'text-sumi' },
                      { label: id ? 'Streak (hari)' : 'Streak (days)', value: String(row.streak || 0), cls: 'text-ai' },
                      { label: id ? 'Akurasi' : 'Accuracy', value: `${Math.round(Number(row.accuracy) || 0)}%`, cls: 'text-shu' },
                    ].map((s) => (
                      <div key={s.label} className="border-[4px] border-sumi bg-kinari p-5 shadow-[6px_6px_0_0_#1a1a1a] text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-sumi/60 mb-1">{s.label}</div>
                        <div className={`text-3xl font-serif font-black ${s.cls}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40 text-center">
                    {id
                      ? 'Pemain ini hanya membuka data dasar. Minta dia menyalakan 「Profil Lengkap」 untuk melihat winrate, penguasaan materi, badge, dan sertifikat.'
                      : 'This player shares basic data only. Ask them to enable 「Full Profile」 to see win rate, subject mastery, badges, and certificate.'}
                  </p>
                </>
              )}

              {/* ── Profil LENGKAP ── */}
              {full && tab === 'ringkasan' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: id ? 'Winrate' : 'Win rate', value: `${stats.winRate.toFixed(1)}%`, cls: 'text-shu' },
                    { label: id ? 'Total Kuis' : 'Total Quiz', value: stats.totalAnswered.toLocaleString(), cls: 'text-sumi' },
                    { label: id ? 'Streak Maks' : 'Max Streak', value: `${stats.maxStreak}`, cls: 'text-ai' },
                    { label: id ? 'Akurasi' : 'Accuracy', value: `${Math.round(stats.accuracy)}%`, cls: 'text-shu' },
                    { label: 'XP', value: Number(row.xp || 0).toLocaleString(), cls: 'text-sumi' },
                    { label: id ? 'Streak Kini' : 'Current Streak', value: `${row.streak || 0}`, cls: 'text-ai' },
                  ].map((s) => (
                    <div key={s.label} className="border-[4px] border-sumi bg-kinari p-5 shadow-[6px_6px_0_0_#1a1a1a] text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-sumi/60 mb-1">{s.label}</div>
                      <div className={`text-3xl font-serif font-black ${s.cls}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {full && tab === 'statistik' && (
                <div className="space-y-8">
                  {/* Penguasaan materi — radar 8 subjek */}
                  <div className="border-[4px] border-sumi bg-kinari p-6 sm:p-8 shadow-[6px_6px_0_0_#1a1a1a]">
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-xl font-serif font-black text-sumi">{id ? 'Penguasaan Materi' : 'Subject Mastery'}</h3>
                      <div className="h-[2px] flex-1 bg-sumi/20"></div>
                    </div>
                    <div className="space-y-5">
                      {radar.map((r) => (
                        <div key={r.subject}>
                          <div className="flex justify-between font-serif font-black text-sm mb-1.5 text-sumi">
                            <span>{id ? SUBJECT_LABEL_ID[r.subject] || r.subject : r.subject}</span>
                            <span>{r.score}%</span>
                          </div>
                          <div className="w-full h-5 bg-kinari-light border-[3px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] overflow-hidden">
                            <motion.div
                              className="h-full bg-shu border-r-[2px] border-sumi"
                              initial={{ width: 0 }}
                              animate={{ width: `${r.score}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badge terpasang */}
                  <div className="border-[4px] border-sumi bg-kinari p-6 sm:p-8 shadow-[6px_6px_0_0_#1a1a1a]">
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-xl font-serif font-black text-sumi">{id ? 'Pencapaian & Badge' : 'Achievements & Badges'}</h3>
                      <div className="h-[2px] flex-1 bg-sumi/20"></div>
                    </div>
                    {badges.length === 0 ? (
                      <p className="text-xs uppercase tracking-widest font-bold text-sumi/50">
                        {id ? 'Belum ada badge terbuka.' : 'No badges unlocked yet.'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {badges.map((bid) => {
                          const meta = ACHIEVEMENT_META[bid];
                          if (!meta) return null;
                          return (
                            <div key={bid} className="border-[3px] border-sumi bg-kinari-light p-4 shadow-[4px_4px_0_0_#1a1a1a] flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full border-[3px] border-shu text-shu flex items-center justify-center font-serif font-black text-xl bg-kinari-light flex-shrink-0">
                                {meta.label}
                              </div>
                              <div className="min-w-0">
                                <div className="font-serif font-black text-sumi truncate">{meta.title}</div>
                                <div className="text-xs text-sumi/70 font-bold">{localized(meta, 'desc', language)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {full && tab === 'sertifikat' && (
                hasCertificate(full)
                  ? <N5Certificate record={full.n5Exam} username={name} />
                  : (
                    <div className="border-[4px] border-sumi bg-kinari p-8 sm:p-12 text-center shadow-[6px_6px_0_0_#1a1a1a]">
                      <div className="text-6xl font-serif font-black text-sumi/20 mb-4">合格証書</div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-sumi/60">
                        {id ? 'Sertifikat Belum Terbit' : 'Certificate Not Issued'}
                      </p>
                      <p className="text-xs font-bold text-sumi/50 mt-2 max-w-md mx-auto leading-relaxed">
                        {id
                          ? 'Pemain ini belum lulus Ujian N5 模擬試験.'
                          : 'This player has not passed the N5 模擬試験 yet.'}
                      </p>
                    </div>
                  )
              )}

              {/* Aksi: 友達 + salin tautan + lihat papan */}
              <div className="flex flex-col sm:flex-row gap-3">
                {card && card.state !== 'self' && (
                  <div className="flex-1 flex justify-center">
                    <FollowButton
                      targetId={card.id}
                      state={card.state}
                      isPublic={true}
                      onChanged={refreshCard}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-4 px-5 border-[3px] border-sumi bg-ai text-kinari-light font-black text-xs tracking-widest uppercase shadow-[4px_4px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1a1a] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Glyph name={copied ? 'check' : 'share'} />
                  {copied ? (id ? 'Tautan tersalin' : 'Link copied') : (id ? 'Salin tautan' : 'Copy link')}
                </button>
                <button
                  type="button"
                  onClick={() => goBackOr(navigate, '/leaderboard')}
                  className="flex-1 py-4 px-5 border-[3px] border-sumi bg-kinari-light text-sumi font-black text-xs tracking-widest uppercase shadow-[4px_4px_0_0_#1a1a1a] hover:bg-sumi hover:text-kinari-light transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Glyph name="trophy" /> {id ? 'Lihat papan peringkat' : 'View leaderboard'}
                </button>
              </div>

              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-sumi/40 text-center">
                {full
                  ? (id
                      ? 'Hanya statistik & koleksi yang dipamerkan pemilik. Medaru, isi tas, dan email tetap privat.'
                      : 'Only the statistics & collection the owner chose to share. Medaru, bag contents, and email stay private.')
                  : (id
                      ? 'Hanya data dasar yang ditampilkan. Medaru, isi tas, dan email tetap privat.'
                      : 'Only basic data is shown. Medaru, bag contents, and email stay private.')}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default PublicProfile;
