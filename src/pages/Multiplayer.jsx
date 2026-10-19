import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useUserStats } from '../features/progress/ProgressContext';
import { EraPaper } from '../components/EraPaper';
import { Glyph } from '../components/icons/Glyph';
import {
  MP_CATEGORIES, MP_QUESTION_COUNTS,
  mulberry32,
  calcSpeedScore,
  tallyTeamScores, determineWinner, findMvp,
  calcMatchXp, calcMatchMedaru,
  autoAssignTeam, makePresenceKey,
} from '../features/multiplayer/multiplayer';
import {
  createRoom, findRoom, subscribeToRoom, getSessionUserId,
  broadcastReady, broadcastSwitchTeam, broadcastStartGame,
  broadcastAnswer, broadcastEmote,
} from '../features/multiplayer/multiplayerApi';
import { RoomLobby } from '../features/multiplayer/RoomLobby';
import { BattleScreen } from '../features/multiplayer/BattleScreen';
import { MatchResultModal } from '../features/multiplayer/MatchResultModal';

// Dataset untuk kuis
import hiraganaData from '../data/hiragana.json';
import katakanaData from '../data/katakana.json';
import kotobaData from '../data/kotoba.json';
import grammarData from '../data/grammar.json';
import kanjiData from '../data/kanji.json';
import { buildOptions, shuffle } from '../features/quiz/questionBuilder';

const DATASETS = {
  hiragana: hiraganaData,
  katakana: katakanaData,
  kotoba: kotobaData,
  grammar: grammarData,
  kanji: kanjiData,
};

export function Multiplayer() {
  const { language } = useLanguage();
  const id = language === 'id';
  const navigate = useNavigate();
  const { progress, username, addXp, loseXp, gainMedaru } = useUserStats();

  // Mode layar: 'browser' | 'lobby' | 'battle' | 'result'
  const [view, setView] = useState('browser');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Room config (Host)
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedCategory, setSelectedCategory] = useState('mixed');
  const [selectedQCount, setSelectedQCount] = useState(10);

  // Active match state
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [channelRef, setChannelRef] = useState(null);

  // In-Game state
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);
  const [liveEmotes, setLiveEmotes] = useState([]);
  const [matchResult, setMatchResult] = useState(null);

  // ── Identitas pemain ───────────────────────────────────────────────────────
  // Presence key HARUS unik per tab. Dulu `progress?.id || 'guest_player'` bikin
  // semua pemain pakai key sama → Supabase menganggapnya satu entitas: pemain
  // kedua menimpa yang pertama (tidak terhitung, tim biru kosong).
  // Key = `<auth.uid()>#<tabId>`; identitas akun disimpan terpisah di `authId`
  // supaya host tetap dikenali walau beda tab.
  const [tabId] = useState(() => {
    try {
      let t = sessionStorage.getItem('mp_tab_id');
      if (!t) {
        t = Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem('mp_tab_id', t);
      }
      return t;
    } catch {
      return Math.random().toString(36).slice(2, 10);
    }
  });

  const makePlayerId = useCallback(
    (uid) => makePresenceKey(uid, tabId),
    [tabId]
  );

  const [currentUserId, setCurrentUserId] = useState(() => `guest_${tabId}`);
  const [authId, setAuthId] = useState(null);

  // auth.uid() = sumber yang sama dengan host_id di DB. Resolve sekali di mount,
  // dan sekali lagi sebelum buat/gabung room (jangan pakai ID sementara).
  const resolvePlayerId = useCallback(async () => {
    const uid = await getSessionUserId();
    const pid = makePlayerId(uid);
    setAuthId(uid);
    setCurrentUserId(pid);
    return { uid, pid };
  }, [makePlayerId]);

  useEffect(() => { resolvePlayerId(); }, [resolvePlayerId]);

  // Niat pemain (siap/tim) disimpan di ref supaya bisa dikirim ulang tiap
  // presence sync — presence state tidak membawa isReady/team.
  const myIntentRef = useRef({ isReady: false, team: null });

  // ── Bersihkan Channel saat unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (channelRef) {
        channelRef.unsubscribe();
      }
    };
  }, [channelRef]);

  // ── Mulai Pertandingan ─────────────────────────────────────────────────────
  const startBattle = useCallback((seed, roomData) => {
    const qList = buildSeededQuestions(seed, roomData?.category || selectedCategory, roomData?.question_count || selectedQCount);
    setQuestions(qList);
    setCurrentQIndex(0);
    setAnswersLog([]);
    setLiveEmotes([]);
    setView('battle');
  }, [selectedCategory, selectedQCount]);

  // ── Setup Realtime Subscription ────────────────────────────────────────────
  const connectToChannel = useCallback((code, roomData, playerId = currentUserId, myAuthId = authId) => {
    const playerInfo = {
      id: playerId,
      authId: myAuthId,
      username: username || '旅人',
      avatar: progress?.avatar || '',
      rank: progress?.rank || 'Kouhai',
    };

    let ch = null;

    ch = subscribeToRoom(code, {
      playerInfo,
      onPresenceSync: (presenceState) => {
        // Presence key = id unik per tab → dua pemain tidak lagi bertabrakan.
        // Host diproses lebih dulu (selalu tim merah), sisanya urut by id supaya
        // semua client menghasilkan alokasi tim yang sama.
        const hostId = roomData?.host_id;
        const allPresent = Object.values(presenceState)
          .flat()
          .filter((p) => p && p.id)
          .sort((a, b) => {
            const ha = hostId && a.authId === hostId ? 0 : 1;
            const hb = hostId && b.authId === hostId ? 0 : 1;
            if (ha !== hb) return ha - hb;
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
          });

        setRoomPlayers((prev) => {
          const prevById = new Map(prev.map((x) => [x.id, x]));
          const mode = roomData?.mode || '1v1';
          const red = [];
          const blue = [];

          return allPresent.map((p) => {
            const existing = prevById.get(p.id);
            // host_id di DB = uuid polos; presence id = `<uid>#<tab>`.
            const isHostPlayer = !!hostId && p.authId === hostId;
            let team;
            // Urutan prioritas: niat sendiri → pilihan manual (broadcast) →
            // default host merah → auto-assign. `existing.team` didahulukan dari
            // default host supaya switch tim host ikut konsisten di client lain.
            if (p.id === playerId && myIntentRef.current.team) {
              team = myIntentRef.current.team;
            } else if (existing?.team) {
              team = existing.team;
            } else if (isHostPlayer) {
              team = 'red'; // host selalu tim merah (sesuai red_team di DB)
            } else {
              team = autoAssignTeam(red, blue, mode) || 'red';
            }
            (team === 'red' ? red : blue).push(p.id);
            return {
              id: p.id,
              authId: p.authId,
              username: p.username,
              avatar: p.avatar,
              rank: p.rank,
              team,
              isReady: isHostPlayer || existing?.isReady || false,
            };
          });
        });

        // Presence TIDAK membawa status siap/tim. Kalau sync datang setelah
        // broadcast saya, pemain lain kehilangan info → kirim ulang intent.
        if (myIntentRef.current.isReady) broadcastReady(ch, playerId, true);
        if (myIntentRef.current.team) broadcastSwitchTeam(ch, playerId, myIntentRef.current.team);
      },
      onBroadcast: (event, payload) => {
        if (event === 'player_ready') {
          setRoomPlayers((prev) =>
            prev.map((p) => (p.id === payload.playerId ? { ...p, isReady: payload.isReady } : p))
          );
        } else if (event === 'switch_team') {
          setRoomPlayers((prev) =>
            prev.map((p) => (p.id === payload.playerId ? { ...p, team: payload.targetTeam } : p))
          );
        } else if (event === 'game_start') {
          startBattle(payload.seed, roomData);
        } else if (event === 'player_answer') {
          setAnswersLog((prev) => [...prev, payload]);
        } else if (event === 'send_emote') {
          const em = { id: Date.now() + Math.random(), emote: payload.emote };
          setLiveEmotes((prev) => [...prev, em]);
          setTimeout(() => {
            setLiveEmotes((prev) => prev.filter((x) => x.id !== em.id));
          }, 3000);
        }
      },
    });

    setChannelRef(ch);
  }, [currentUserId, authId, username, progress, startBattle]);

  // ── Buat Room Baru ─────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMsg('');
    // Resolve dulu: presence id harus `<auth.uid()>#<tab>`, bukan id sementara.
    const { uid, pid } = await resolvePlayerId();
    const res = await createRoom({
      mode: selectedMode,
      category: selectedCategory,
      questionCount: selectedQCount,
    });
    setIsLoading(false);

    if (!res.ok) {
      setErrorMsg(res.error === 'unconfigured'
        ? (id ? 'Backend Supabase belum aktif.' : 'Supabase backend not configured.')
        : (id ? 'Gagal membuat room.' : 'Failed to create room.'));
      return;
    }

    setActiveRoom(res.room);
    setView('lobby');
    connectToChannel(res.code, res.room, pid, uid);
  };

  // ── Gabung Room by Code ────────────────────────────────────────────────────
  const handleJoinByCode = async () => {
    if (!joinCode || joinCode.length < 6) return;
    setIsLoading(true);
    setErrorMsg('');
    const { uid, pid } = await resolvePlayerId();
    const res = await findRoom(joinCode);
    setIsLoading(false);

    if (!res.ok) {
      setErrorMsg(id ? 'Room tidak ditemukan atau sudah selesai.' : 'Room not found or expired.');
      return;
    }

    setActiveRoom(res.room);
    setView('lobby');
    connectToChannel(res.room.code, res.room, pid, uid);
  };

  // ── Builder Soal Kuis Ber-Seed ─────────────────────────────────────────────
  const buildSeededQuestions = (seed, category, count) => {
    const rng = mulberry32(seed);
    let pool = [];

    if (category === 'mixed') {
      pool = [...hiraganaData, ...katakanaData, ...kotobaData, ...kanjiData, ...grammarData];
    } else {
      pool = DATASETS[category] || hiraganaData;
    }

    const shuffled = shuffle(pool, rng).slice(0, count);
    return shuffled.map((item) => ({
      ...item,
      options: buildOptions(item, pool, 4, DATASETS, rng),
    }));
  };

  const handleHostStartGame = () => {
    const seed = Math.floor(Math.random() * 1000000);
    broadcastStartGame(channelRef, { seed, startedAt: Date.now() });
    startBattle(seed, activeRoom);
  };

  // ── Interaksi Player Dalam Room ────────────────────────────────────────────
  const handleToggleReady = () => {
    const me = roomPlayers.find((p) => p.id === currentUserId);
    const newReady = !me?.isReady;
    myIntentRef.current.isReady = newReady;
    setRoomPlayers((prev) =>
      prev.map((p) => (p.id === currentUserId ? { ...p, isReady: newReady } : p))
    );
    broadcastReady(channelRef, currentUserId, newReady);
  };

  const handleSwitchTeam = (targetTeam) => {
    myIntentRef.current.team = targetTeam;
    setRoomPlayers((prev) =>
      prev.map((p) => (p.id === currentUserId ? { ...p, team: targetTeam } : p))
    );
    broadcastSwitchTeam(channelRef, currentUserId, targetTeam);
  };

  const handleSendEmote = (emote) => {
    broadcastEmote(channelRef, currentUserId, emote);
    const em = { id: Date.now() + Math.random(), emote };
    setLiveEmotes((prev) => [...prev, em]);
    setTimeout(() => {
      setLiveEmotes((prev) => prev.filter((x) => x.id !== em.id));
    }, 3000);
  };

  // ── Player Menjawab Soal ───────────────────────────────────────────────────
  const handleSelectOption = (idx, secondsUsed) => {
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    const me = roomPlayers.find((p) => p.id === currentUserId);
    const isCorrect = idx !== null && currentQ.options[idx]?.id === currentQ.id;
    const points = calcSpeedScore(secondsUsed, isCorrect);

    const ansPayload = {
      playerId: currentUserId,
      team: me?.team || 'red',
      qIndex: currentQIndex,
      isCorrect,
      points,
    };

    setAnswersLog((prev) => [...prev, ansPayload]);
    broadcastAnswer(channelRef, ansPayload);

    // Maju ke soal berikutnya setelah jeda 1.5s
    setTimeout(() => {
      if (currentQIndex + 1 < questions.length) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        finishMatch();
      }
    }, 1500);
  };

  // ── Selesaikan Pertandingan ────────────────────────────────────────────────
  const finishMatch = () => {
    const scores = tallyTeamScores(answersLog);
    const winner = determineWinner(scores.red, scores.blue);
    const me = roomPlayers.find((p) => p.id === currentUserId);
    const myTeam = me?.team || 'red';
    const mvp = findMvp(scores.perPlayer, roomPlayers.filter((p) => p.team === 'red').map((p) => p.id), roomPlayers.filter((p) => p.team === 'blue').map((p) => p.id));
    const isMvp = mvp?.mvpId === currentUserId;

    const xpDelta = calcMatchXp(activeRoom?.mode || '1v1', myTeam, winner, progress?.xp || 0, isMvp);
    const medaru = calcMatchMedaru(myTeam, winner);

    // Eksekusi XP delta & Medaru ke state pemain
    if (xpDelta > 0) addXp(xpDelta);
    else if (xpDelta < 0) loseXp(Math.abs(xpDelta));
    gainMedaru(medaru);

    setMatchResult({
      winner,
      myTeam,
      finalScores: scores,
      mvp,
      xpDelta,
      medaruReward: medaru,
      players: roomPlayers,
      perPlayerScore: scores.perPlayer,
    });

    setView('result');
  };

  const handleBackToLobby = () => {
    if (channelRef) {
      channelRef.unsubscribe();
      setChannelRef(null);
    }
    setView('browser');
    setActiveRoom(null);
    setRoomPlayers([]);
    // Niat lama (siap/tim) jangan terbawa ke room berikutnya.
    myIntentRef.current = { isReady: false, team: null };
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-10 min-h-screen flex flex-col">
      <EraPaper />

      {/* Back button */}
      <button
        onClick={() => {
          if (view === 'browser') navigate('/');
          else handleBackToLobby();
        }}
        className="text-[10px] uppercase tracking-[0.3em] font-bold text-sumi/60 hover:text-shu transition-colors flex items-center gap-2 mb-6 w-fit cursor-pointer relative z-20"
      >
        <span>←</span> {view === 'browser' ? (id ? 'Kembali ke Beranda' : 'Back to Home') : (id ? 'Tinggalkan Room' : 'Leave Room')}
      </button>

      {/* ── 1. LOBBY BROWSER ── */}
      {view === 'browser' && (
        <div className="relative z-10 space-y-6">
          <header className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-10 shadow-[6px_6px_0_0_#1a1a1a]">
            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-sumi/50">
              {id ? 'Arena Multiplayer Live' : 'Live Multiplayer Arena'}
            </span>
            <h1 className="text-4xl sm:text-6xl font-serif font-black text-sumi tracking-tight mt-1">
              合戦 <span className="text-ai">· Gassen</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-sumi/70 mt-3 max-w-xl leading-relaxed">
              {id
                ? 'Tantang teman dalam pertarungan kuis langsung 1v1 (Duel) atau 2v2 (Regu Merah vs Biru). Poin ditentukan oleh ketepatan dan kecepatan menjawab.'
                : 'Challenge friends in 1v1 duel or 2v2 team battle. Points are scored based on accuracy and speed.'}
            </p>
          </header>

          {errorMsg && (
            <div className="p-4 border-[3px] border-shu bg-shu/10 text-shu text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Kartu Buat Room */}
            <div className="border-[4px] border-sumi bg-kinari-light p-6 shadow-[6px_6px_0_0_#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-2 border-[2px] border-sumi bg-ai text-kinari-light"><Glyph name="plus" size={18} /></span>
                  <h3 className="text-lg font-serif font-black text-sumi">{id ? 'Buat Room Baru' : 'Create New Room'}</h3>
                </div>

                <div className="space-y-4 text-xs font-bold text-sumi">
                  {/* Mode */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-sumi/60 mb-1">{id ? 'Format Mode:' : 'Format Mode:'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['1v1', '2v2'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMode(m)}
                          className={`py-2 border-[2px] border-sumi font-black ${selectedMode === m ? 'bg-ai text-kinari-light' : 'bg-kinari text-sumi'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kategori Bank */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-sumi/60 mb-1">{id ? 'Materi Kuis:' : 'Quiz Pool:'}</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2.5 border-[2px] border-sumi bg-kinari font-bold text-xs uppercase"
                    >
                      {MP_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Jumlah Soal */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-sumi/60 mb-1">{id ? 'Jumlah Soal:' : 'Question Count:'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {MP_QUESTION_COUNTS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSelectedQCount(n)}
                          className={`py-2 border-[2px] border-sumi font-black ${selectedQCount === n ? 'bg-ai text-kinari-light' : 'bg-kinari text-sumi'}`}
                        >
                          {n} {id ? 'Soal' : 'Questions'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                type="button"
                className="w-full mt-6 py-3.5 border-[3px] border-sumi bg-ai text-kinari-light font-black uppercase tracking-widest text-xs shadow-[3px_3px_0_0_#1a1a1a] hover:brightness-110 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {isLoading ? '...' : (id ? '▶ Buat Room (部屋作成)' : '▶ Create Room')}
              </button>
            </div>

            {/* Kartu Masuk Room via Kode */}
            <div className="border-[4px] border-sumi bg-kinari-light p-6 shadow-[6px_6px_0_0_#1a1a1a] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-2 border-[2px] border-sumi bg-shu text-kinari-light"><Glyph name="search" size={18} /></span>
                  <h3 className="text-lg font-serif font-black text-sumi">{id ? 'Masuk Lewat Kode' : 'Join with Code'}</h3>
                </div>

                <p className="text-xs font-bold text-sumi/70 mb-4 leading-relaxed">
                  {id
                    ? 'Punya kode room 6 digit dari teman? Masukkan kodenya di bawah untuk bergabung.'
                    : 'Have a 6-digit room code from a friend? Enter it below to join.'}
                </p>

                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="KODE (MISAL: K9P2X4)"
                  className="w-full p-3 border-[3px] border-sumi bg-kinari text-center font-mono font-black text-lg tracking-widest uppercase focus:bg-kinari-light outline-none"
                />
              </div>

              <button
                onClick={handleJoinByCode}
                disabled={isLoading || joinCode.length < 6}
                type="button"
                className={`w-full mt-6 py-3.5 border-[3px] border-sumi font-black uppercase tracking-widest text-xs shadow-[3px_3px_0_0_#1a1a1a] transition-all ${
                  joinCode.length >= 6
                    ? 'bg-shu text-kinari-light hover:brightness-110 cursor-pointer'
                    : 'bg-sumi/20 text-sumi/40 border-sumi/30 cursor-not-allowed'
                }`}
              >
                {isLoading ? '...' : (id ? 'Gabung Room' : 'Join Room')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ROOM LOBBY LOUNGE ── */}
      {view === 'lobby' && (
        <div className="relative z-10">
          <RoomLobby
            room={activeRoom}
            players={roomPlayers}
            currentUserId={currentUserId}
            isHost={!!activeRoom?.host_id && activeRoom.host_id === authId}
            onSwitchTeam={handleSwitchTeam}
            onToggleReady={handleToggleReady}
            onStartGame={handleHostStartGame}
            onLeaveRoom={handleBackToLobby}
            language={language}
          />
        </div>
      )}

      {/* ── 3. BATTLE ARENA ── */}
      {view === 'battle' && (
        <div className="relative z-10 flex-1 flex flex-col">
          <BattleScreen
            question={questions[currentQIndex]}
            questionIndex={currentQIndex}
            totalQuestions={questions.length}
            myTeam={roomPlayers.find((p) => p.id === currentUserId)?.team || 'red'}
            currentUserId={currentUserId}
            players={roomPlayers}
            teamScores={tallyTeamScores(answersLog)}
            playerAnswers={answersLog.filter((a) => a.qIndex === currentQIndex).reduce((acc, curr) => ({ ...acc, [curr.playerId]: curr }), {})}
            liveEmotes={liveEmotes}
            onSelectOption={handleSelectOption}
            onSendEmote={handleSendEmote}
            language={language}
          />
        </div>
      )}

      {/* ── 4. MATCH RESULT MODAL ── */}
      {view === 'result' && matchResult && (
        <MatchResultModal
          winner={matchResult.winner}
          myTeam={matchResult.myTeam}
          finalScores={matchResult.finalScores}
          mvp={matchResult.mvp}
          xpDelta={matchResult.xpDelta}
          medaruReward={matchResult.medaruReward}
          players={matchResult.players}
          perPlayerScore={matchResult.perPlayerScore}
          onBackToLobby={handleBackToLobby}
          language={language}
        />
      )}
    </div>
  );
}
export default Multiplayer;
