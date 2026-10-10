// ─────────────────────────────────────────────────────────────────────────────
// クレーンゲーム — halaman gacha karakter 多元 (LAPIS 3, A5). Ambil figur dari
// kolam karakter dunia yang DIMILIKI. Menang = karakter masuk koleksi; pilih
// satu sebagai 推し. Duplikat → refund koin. Token [data-era="anime"].
// Lihat PRD docs/tema/anime.md §8 · SPEC §A5.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { medaruCopy } from '../features/progress/medaruCopy';
import { characterById, characterHissatsu } from '../features/anime/characters';
import { clawPrice, rollClaw, clawRefund, CLAW_DUPLICATE_REFUND } from '../features/anime/claw';
import { MedaruCoin } from '../components/MedaruCoin';

export function AnimeClaw() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { progress, characterPool, pullCharacter, setOshi, spendMedaru, gainMedaru } = useUserStats();
  const id = language === 'id';
  const money = medaruCopy('anime', language);

  const owned = progress?.ownedCharacters || {};
  const oshiId = progress?.oshiId || null;
  const pool = characterPool();
  const balance = progress?.medaru || 0;

  const [last, setLast] = useState(null); // { results:[{id,isNew}], refunded }

  const play = (count) => {
    if (pool.length === 0) return;
    const price = clawPrice(count);
    if (balance < price) return;
    if (!spendMedaru(price)) return;

    const ids = rollClaw(pool, count);
    const refunded = clawRefund(ids, owned);
    const results = ids.map((cid) => {
      const isNew = !owned[cid];
      pullCharacter(cid);
      return { id: cid, isNew };
    });
    if (refunded > 0) gainMedaru(refunded);
    setLast({ results, refunded });
  };

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sumi/70 transition-colors hover:text-sumi"
      >
        ← {id ? 'Kembali' : 'Back'}
      </button>

      <div className="mb-6">
        <h1 className="font-display font-black leading-tight text-sumi" style={{ fontSize: 'clamp(2rem, 7vw, 3.2rem)' }}>
          クレーンゲーム
        </h1>
        <p className="mt-1 font-sans text-sm font-bold tracking-[0.3em] text-sumi/70">
          CRANE GAME · {id ? 'Koleksi Karakter' : 'Character Collection'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 border-[3px] border-sumi bg-kinari-light px-3 py-1.5 font-sans text-xs font-black text-sumi" style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}>
            <MedaruCoin size={14} /> {balance.toLocaleString()} {money.nameShort}
          </span>
          <span className="font-sans text-xs font-bold text-sumi/60">
            {id ? 'Kolam' : 'Pool'}: {pool.length}
          </span>
        </div>
      </div>

      {pool.length === 0 ? (
        <div className="border-[3px] border-sumi/40 bg-kinari-light/50 p-6 text-center" style={{ borderRadius: 6 }}>
          <p className="font-sans text-sm font-semibold text-sumi/70">
            {id
              ? 'Belum ada dunia. Beli satu dunia dulu di 物販 agar mesin ini terisi karakter.'
              : 'No world yet. Buy a world at 物販 first so this machine has characters.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/anime-shop')}
            className="mt-4 border-[3px] border-sumi bg-kinari-light px-4 py-2 font-sans text-xs font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light"
            style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 #1a1a1a' }}
          >
            物販 →
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {[1, 10].map((count) => {
              const price = clawPrice(count);
              const can = balance >= price;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => play(count)}
                  disabled={!can}
                  className="border-[3px] border-sumi bg-kinari-light px-4 py-3 font-sans text-xs font-black uppercase tracking-wider text-sumi transition-colors hover:bg-sumi hover:text-kinari-light disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderRadius: 6, boxShadow: '5px 5px 0 0 #1a1a1a' }}
                >
                  {count === 1 ? (id ? 'Coba 1×' : 'Pull 1×') : (id ? 'Coba 10×' : 'Pull 10×')}
                  {' · '}
                  <MedaruCoin size={12} /> {price.toLocaleString()}
                </button>
              );
            })}
          </div>

          {/* Hasil undian terakhir */}
          {last && (
            <div className="mt-6 border-[3px] border-sumi bg-kinari-light/60 p-4" style={{ borderRadius: 6, boxShadow: '5px 5px 0 0 rgba(20,20,18,0.9)' }}>
              <p className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/50">
                {id ? 'Hasil' : 'Results'}{last.refunded > 0 ? ` · +${last.refunded} ${money.nameShort}` : ''}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {last.results.map((r, i) => {
                  const c = characterById(r.id);
                  const h = characterHissatsu(r.id);
                  return (
                    <li
                      key={`${r.id}-${i}`}
                      className="border-[2px] border-sumi px-2 py-1 font-sans text-[0.7rem] font-bold"
                      style={{ borderRadius: 4, background: r.isNew ? '#fff7d6' : 'transparent', opacity: r.isNew ? 1 : 0.55 }}
                    >
                      {c?.kanji} {c?.name}{h ? ` · ${h.jp}` : ''}{r.isNew ? (id ? ' ✦BARU' : ' ✦NEW') : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Koleksi + 推し */}
          <div className="mt-8">
            <p className="mb-3 font-sans text-[0.6rem] font-bold uppercase tracking-[0.3em] text-sumi/50">
              {id ? 'Koleksi' : 'Collection'} · {Object.keys(owned).length}
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pool.map((c) => {
                const has = !!owned[c.id];
                const isOshi = oshiId === c.id;
                return (
                  <li
                    key={c.id}
                    className="border-[3px] border-sumi bg-kinari-light/60 p-3"
                    style={{ borderRadius: 6, boxShadow: '3px 3px 0 0 rgba(20,20,18,0.9)', opacity: has ? 1 : 0.5 }}
                  >
                    <p className="font-display text-lg font-black text-sumi">{c.kanji}</p>
                    <p className="font-sans text-xs font-bold text-sumi/70">{c.name}</p>
                    <p className="font-sans text-[0.65rem] text-sumi/55">{c.hissatsu_jp}</p>
                    {has && (
                      <button
                        type="button"
                        onClick={() => setOshi(isOshi ? null : c.id)}
                        aria-pressed={isOshi}
                        className={`mt-2 w-full border-[2px] border-sumi px-2 py-1 font-sans text-[0.65rem] font-black uppercase tracking-wider transition-colors ${isOshi ? 'bg-shu text-kinari-light' : 'bg-kinari-light text-sumi hover:bg-sumi hover:text-kinari-light'}`}
                        style={{ borderRadius: 4 }}
                      >
                        {isOshi ? '推し ★' : '推し'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {last && last.refunded === 0 && (
              <p className="mt-3 font-sans text-[0.65rem] text-sumi/50">
                {id
                  ? `Duplikat dikembalikan ${CLAW_DUPLICATE_REFUND} ${money.nameShort} per figur.`
                  : `Duplicates refund ${CLAW_DUPLICATE_REFUND} ${money.nameShort} each.`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AnimeClaw;
