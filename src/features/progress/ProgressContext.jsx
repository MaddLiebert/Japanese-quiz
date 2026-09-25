import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getPack, rollPackId, isPackReady } from '../packs/packs';
import { getItem, addItem, removeItem } from '../items/items';
import { applyStreakBonus } from './streak';

// Fungsi ini jagoan buat ngambil tanggal LOKAL HP/Laptop (YYYY-MM-DD)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Baca JSON dari localStorage tanpa bikin app crash kalau datanya korup.
const safeParse = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

// --- USER STATS CONTEXT ---
const UserStatsContext = createContext(null);
export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) throw new Error('useUserStats must be used within a ProgressProvider');
  return context;
};

export const getRank = (xp) => {
  if (xp < 5000) return "Kouhai 🐣";
  if (xp < 10000) return "Senpai 🗡️";
  if (xp < 20000) return "Sensei 📜";
  return "Shogun 👹";
};

const DEFAULT_PROGRESS = {
  xp: 0,
  level: 1,
  accuracy: 0,
  weightedWinRate: 0,
  matchesPlayed: 0,
  medaru: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  maxStreak: 0,
  ownedPacks: [],
  activePack: null,
  ownedItems: {},
  lastActiveDate: getLocalDateString()
};

const DIFFICULTY_MAP = { easy: 0.8, medium: 1.0, hard: 1.2 };
const WIN_GAIN_RATE = 0.1;   // fraksi jarak ke 100% yang ditempuh tiap menang
const LOSS_RATE = 0.15;      // fraksi WR yang hilang saat kalah total
const PER_WRONG_RATE = 0.02; // fraksi WR yang dipotong per jawaban salah (walau menang)
const MEDARU_PER_CORRECT = 2; // medaru yang didapat tiap jawaban benar

// Harga & refund gacha (mengikuti harga pack di registry PACKS).
const GACHA_PRICE_1X = 100;
const GACHA_PRICE_10X = 900;
const DUPLICATE_REFUND = 50; // refund per duplikat (keputusan user #2)

// --- ITEM PROGRESS CONTEXT ---
const ItemProgressContext = createContext(null);
export const useItemProgress = () => {
  const context = useContext(ItemProgressContext);
  if (!context) throw new Error('useItemProgress must be used within a ProgressProvider');
  return context;
};

const DEFAULT_ITEM_PROGRESS = {}; // { [itemId]: { correctCount, incorrectCount, streak, lastReviewed, nextReview, status } }

// --- ACHIEVEMENTS CONTEXT ---
const AchievementsContext = createContext(null);
export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) throw new Error('useAchievements must be used within a ProgressProvider');
  return context;
};

const DEFAULT_ACHIEVEMENTS = [];
export const ACHIEVEMENT_META = {
  // Scripts (6)
  hiragana_origin: { label: '平', title: 'Hiragana Origin', desc: 'Kuasai Hiragana' },
  katakana_edge: { label: '片', title: 'Katakana Edge', desc: 'Kuasai Katakana' },
  kanji_slayer: { label: '斬', title: 'Kanji Slayer', desc: '50 Kanji Correct' },
  kanji_hell: { label: '獄', title: 'Kanji Hell', desc: '200 Kanji Correct' },
  eagle_eye: { label: '眼', title: 'Eagle Eye', desc: '500 Total Correct' },
  master_calligrapher: { label: '墨', title: 'Master Calligrapher', desc: '1000 Total Correct' },
  // Language Arts (6)
  bunpo_student: { label: '文', title: 'Bunpo Student', desc: '10 Grammar sessions' },
  bunpo_master: { label: '典', title: 'Bunpo Master', desc: '50 Grammar sessions' },
  wordsmith: { label: '語', title: 'Wordsmith', desc: 'Master 100 Kotoba' },
  the_vault: { label: '蔵', title: 'The Vault', desc: 'Master 300 Kotoba' },
  dictionary_eater: { label: '辞', title: 'Dictionary Eater', desc: 'Master 500 Kotoba' },
  the_fluent: { label: '通', title: 'The Fluent', desc: '100 Grammar Correct' },
  // Auditory Path (4)
  golden_ears: { label: '聴', title: 'Golden Ears', desc: '5 Mondai chapters' },
  echo_of_truth: { label: '響', title: 'Echo of Truth', desc: '100% on long Mondai' },
  sonic_wave: { label: '波', title: 'Sonic Wave', desc: '20 Mondai chapters' },
  inner_ear: { label: '心', title: 'Inner Ear', desc: 'Complete all Mondai' },
  // Warrior's Spirit (6)
  undefeated: { label: '不', title: 'Undefeated', desc: 'Streak belajar 15 hari' },
  godlike: { label: '神', title: 'Godlike', desc: 'Streak belajar 50 hari' },
  persistent: { label: '極', title: 'Persistent', desc: 'Streak belajar 7 hari' },
  eternal_soul: { label: '魂', title: 'Eternal Soul', desc: 'Streak belajar 30 hari' },
  consistent: { label: '恒', title: 'Consistent', desc: 'Streak belajar 100 hari' },
  void: { label: '無', title: 'Void', desc: '100 Correct in one sitting' },
  // Combat Prowess (4)
  lightning_bolt: { label: '雷', title: 'Lightning Bolt', desc: 'Sub-2s per question' },
  bullseye: { label: '的', title: 'Bullseye', desc: '100% Accuracy (min 20)' },
  hurricane: { label: '疾', title: 'Hurricane', desc: 'Clear 50 questions fast' },
  awakened: { label: '覚', title: 'Awakened', desc: '10 correct in <20s' },
  // Hermit's Habits (6)
  night_owl: { label: '夜', title: 'Night Owl', desc: 'Study after 23:00' },
  early_bird: { label: '暁', title: 'Early Bird', desc: 'Study before 07:00' },
  purifier: { label: '清', title: 'Purifier', desc: 'Clear all Weak Items' },
  busy_samurai: { label: '忙', title: 'Busy Samurai', desc: 'Study 3x/day' },
  no_rest: { label: '休', title: 'No Rest', desc: 'Study on weekends' },
  festival_goer: { label: '祭', title: 'Festival Goer', desc: 'Study on holiday' },
  // Rank & Prestige (5)
  novice: { label: '初', title: 'Novice', desc: '100 XP' },
  warrior: { label: '武', title: 'Warrior', desc: '1,000 XP' },
  venerable: { label: '伯', title: 'Venerable', desc: '5,000 XP' },
  grand_shogun: { label: '将', title: 'Grand Shogun', desc: '10,000 XP' },
  zenith: { label: '頂', title: 'The Zenith', desc: 'Level 1000 Achieved' },
};

// ── Migrasi state lama (ownedEffects/activeEffect) → packs ──────────────────
const migratePacks = (p) => {
  if (!p) return p;
  const legacyOwned = Array.isArray(p.ownedEffects) ? p.ownedEffects : null;
  if (legacyOwned) {
    p.ownedPacks = [...new Set([...(p.ownedPacks || []), ...legacyOwned])];
    if (p.activePack == null && p.activeEffect != null) p.activePack = p.activeEffect;
    delete p.ownedEffects;
    delete p.activeEffect;
  }
  return p;
};

export const ProgressProvider = ({ children }) => {
  // 1. User Stats State
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('user_progress_v2');
    if (!saved) return DEFAULT_PROGRESS;
    try {
      const parsed = JSON.parse(saved);
      // Merge dengan default (backfill field hilang) + migrasi state pack.
      return migratePacks({ ...DEFAULT_PROGRESS, ...(parsed || {}) });
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  // Ref agar pembacaan saldo selalu fresh (mis. di spendMedaru)
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });

  // 2. Item Progress State
  const [itemProgress, setItemProgress] = useState(() => {
    const parsed = safeParse(localStorage.getItem('item_progress_v2'), DEFAULT_ITEM_PROGRESS);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : DEFAULT_ITEM_PROGRESS;
  });

  // 3. Achievements State
  const [achievements, setAchievements] = useState(() => {
    const parsed = safeParse(localStorage.getItem('achievements_unlocked_v2'), DEFAULT_ACHIEVEMENTS);
    const arr = Array.isArray(parsed) ? parsed : DEFAULT_ACHIEVEMENTS;
    // Buang ID hantu legacy tanpa meta (mis. '100_xp', 'clean_up', 'speed_demon')
    // supaya hitungan cap di Home & Profil selalu akurat.
    return arr.filter((id) => ACHIEVEMENT_META[id]);
  });

  const [selectedBadges, setSelectedBadges] = useState(() => {
    const parsed = safeParse(localStorage.getItem('selected_badges'), []);
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.filter((id) => ACHIEVEMENT_META[id]);
  });

  // Effect to save User Stats
  useEffect(() => {
    localStorage.setItem('username', username);
    localStorage.setItem('user_progress_v2', JSON.stringify(progress));
  }, [username, progress]);

  // Effect to save Item Progress
  useEffect(() => {
    localStorage.setItem('item_progress_v2', JSON.stringify(itemProgress));
  }, [itemProgress]);

  // Effect to save Achievements
  useEffect(() => {
    localStorage.setItem('achievements_unlocked_v2', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('selected_badges', JSON.stringify(selectedBadges));
  }, [selectedBadges]);

  // Derived Weak Items
  const weakItems = useMemo(() => {
    const weakIds = [];
    const today = getLocalDateString();
    
    Object.entries(itemProgress).forEach(([itemId, stats]) => {
      // Masuk weak queue jika pernah dikerjakan dan sudah waktunya direview
      // ATAU statusnya masih 'learning' (sedang susah-susahnya)
      if (stats.nextReview <= today || stats.status === 'learning') {
         weakIds.push(itemId);
      }
    });
    return weakIds;
  }, [itemProgress]);

  const checkAchievements = useCallback(() => {
    setAchievements(prev => {
      const next = [...prev];
      const add = (id) => { if (!next.includes(id)) next.push(id); };

      if (progress.totalAnswered > 0) add('hiragana_origin');
      if (progress.xp >= 100) add('novice');
      if (progress.xp >= 1000) add('warrior');
      if (progress.xp >= 5000) add('venerable');
      if (progress.xp >= 10000) add('grand_shogun');
      if (progress.level >= 1000) add('zenith');

      if (weakItems.length === 0 && progress.totalAnswered > 10) {
        add('purifier');
      }
      if (progress.totalAnswered >= 50) { add('kanji_slayer'); add('kanji_hell'); }
      if (progress.totalAnswered >= 500) add('eagle_eye');
      if (progress.totalAnswered >= 1000) add('master_calligrapher');

      if (progress.maxStreak >= 15) add('undefeated');
      if (progress.maxStreak >= 50) add('godlike');
      if (progress.streak >= 7) add('persistent');
      if (progress.streak >= 30) add('eternal_soul');
      if (progress.streak >= 100) add('consistent');

      const hour = new Date().getHours();
      if (hour >= 23 || hour < 4) add('night_owl');
      if (hour < 7 && hour >= 4) add('early_bird');

      return next;
    });
  }, [progress.totalAnswered, progress.xp, progress.maxStreak, progress.level, progress.streak, weakItems.length]);

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const addXp = useCallback((amount) => {
    setProgress(prev => {
      const today = getLocalDateString();
      let newStreak = prev.streak || 0;
      let newMaxStreak = prev.maxStreak || 0;

      if (prev.lastActiveDate !== today) {
        const lastDateParts = prev.lastActiveDate.split('-');
        const lastDate = new Date(lastDateParts[0], lastDateParts[1] - 1, lastDateParts[2]);
        const currentDateParts = today.split('-');
        const currentDate = new Date(currentDateParts[0], currentDateParts[1] - 1, currentDateParts[2]);

        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }

        if (newStreak > newMaxStreak) {
          newMaxStreak = newStreak;
        }
      } else if (prev.streak === 0) {
        newStreak = 1;
        newMaxStreak = Math.max(1, newMaxStreak);
      }

      // Bonus streak: +5% XP saat streak aktif (lihat streak.js).
      // Dihitung dari streak HASIL update hari ini → jawaban pertama yang
      // menyalakan streak pun langsung dapat bonus; streak 0 → apa adanya.
      const gained = applyStreakBonus(amount, { streak: newStreak });
      const newXp = (prev.xp || 0) + gained;
      const newLevel = Math.min(Math.floor(newXp / 100) + 1, 1000);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        maxStreak: newMaxStreak,
        lastActiveDate: today
      };
    });
  }, []);

  const recordAnswer = useCallback((itemId, isCorrect, xpReward = 10) => {
    const today = getLocalDateString();
    
    // 1. Update Global Stats
    setProgress(prev => {
      const newTotalAnswered = (prev.totalAnswered || 0) + 1;
      const newTotalCorrect = isCorrect ? (prev.totalCorrect || 0) + 1 : (prev.totalCorrect || 0);
      const newAccuracy = Math.round((newTotalCorrect / newTotalAnswered) * 100);

      return {
        ...prev,
        totalAnswered: newTotalAnswered,
        totalCorrect: newTotalCorrect,
        accuracy: newAccuracy
      };
    });


    // 2. Update Item SRS
    setItemProgress(prev => {
      const stats = prev[itemId] || {
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        lastReviewed: null,
        nextReview: today,
        status: 'unseen'
      };

      let newStreak = isCorrect ? stats.streak + 1 : 0;
      
      // Hitung next review date berdasarkan SRS (Spaced Repetition System) sederhana
      const reviewDate = new Date();
      if (isCorrect) {
          const daysToAdd = Math.pow(2, newStreak);
          reviewDate.setDate(reviewDate.getDate() + daysToAdd);
      } else {
          reviewDate.setDate(reviewDate.getDate() + 1); // besok harus review lagi
      }
      const nextReview = getLocalDateString(reviewDate);

      // Tentukan status
      let status = 'learning';
      if (newStreak >= 3) status = 'mastered';
      else if (newStreak >= 2) status = 'familiar';

      return {
        ...prev,
        [itemId]: {
          correctCount: stats.correctCount + (isCorrect ? 1 : 0),
          incorrectCount: stats.incorrectCount + (!isCorrect ? 1 : 0),
          streak: newStreak,
          lastReviewed: today,
          nextReview: nextReview,
          status: status
        }
      };
    });
    
    if (isCorrect) {
       addXp(xpReward);
    }
  }, [addXp]);

  const forceMasterItem = useCallback((itemId) => {
     const today = getLocalDateString();
     setItemProgress(prev => {
        const current = prev[itemId];
        if (current?.status === 'mastered') {
          return {
            ...prev,
            [itemId]: {
              correctCount: current.correctCount || 0,
              incorrectCount: current.incorrectCount || 0,
              streak: 0,
              lastReviewed: today,
              nextReview: today,
              status: 'learning'
            }
          };
        }
        return {
          ...prev,
          [itemId]: {
            correctCount: (current?.correctCount || 0) + 3,
            incorrectCount: current?.incorrectCount || 0,
            streak: 3,
            lastReviewed: today,
            nextReview: getLocalDateString(new Date(Date.now() + 86400000 * 8)),
            status: 'mastered'
          }
        };
     });
  }, []);

  const completeQuiz = useCallback((isWin, difficulty, chapter, wrongCount = 0, totalQuestions = 0) => {
    setProgress(prev => {
      const newMatchesPlayed = (prev.matchesPlayed || 0) + 1;
      const oldWR = prev.weightedWinRate || 0;
      let newWR = oldWR;

      const difficultyMult = DIFFICULTY_MAP[difficulty] || 1.0;
      const chapterMult = 1 + (chapter - 1) * 0.05;
      const factor = difficultyMult * chapterMult;

      if (newMatchesPlayed === 1) {
        newWR = isWin ? 100 : 0;
      } else if (isWin) {
        newWR = oldWR + (100 - oldWR) * WIN_GAIN_RATE * factor;
      } else {
        // Kalah: penalti proporsional jumlah salah
        const wrongRatio = totalQuestions > 0 ? (wrongCount / totalQuestions) : 1;
        newWR = oldWR - (oldWR * LOSS_RATE * wrongRatio * factor);
      }

      // Hybrid: tiap jawaban salah tetap memotong WR, walau sesinya menang
      if (isWin && wrongCount > 0) {
        const wrongCut = Math.min(0.25, PER_WRONG_RATE * wrongCount * factor);
        newWR -= newWR * wrongCut;
      }

      const finalWR = Math.max(0, Math.min(100, newWR));

      // Reward medaru: +2 per jawaban benar
      const correctCount = Math.max(0, totalQuestions - wrongCount);
      const medaruGained = correctCount * MEDARU_PER_CORRECT;

      return {
        ...prev,
        matchesPlayed: newMatchesPlayed,
        weightedWinRate: finalWR,
        medaru: (prev.medaru || 0) + medaruGained
      };
    });
  }, []);

  // Belanja medaru. Return true kalau cukup & berhasil, false kalau saldo kurang.
  const spendMedaru = useCallback((amount) => {
    const balance = progressRef.current?.medaru || 0;
    if (balance < amount) return false;
    setProgress(prev => {
      const bal = prev.medaru || 0;
      if (bal < amount) return prev; // guard: jangan sampai minus
      return { ...prev, medaru: bal - amount };
    });
    return true;
  }, []);

  // Beli barang konsumsi. Return: 'bought' | 'poor' | 'invalid'.
  const buyItem = useCallback((itemId, qty = 1) => {
    const item = getItem(itemId);
    if (!item || qty <= 0) return 'invalid';
    const total = item.price * qty;
    const balance = progressRef.current?.medaru || 0;
    if (balance < total) return 'poor';
    setProgress(prev => {
      const bal = prev.medaru || 0;
      if (bal < total) return prev;
      return { ...prev, medaru: bal - total, ownedItems: addItem(prev.ownedItems, itemId, qty) };
    });
    return 'bought';
  }, []);

  // Pakai barang (kurangi 1). Return: 'used' | 'empty' | 'invalid'.
  const consumeItem = useCallback((itemId) => {
    const item = getItem(itemId);
    if (!item) return 'invalid';
    const have = progressRef.current?.ownedItems?.[itemId] || 0;
    if (have <= 0) return 'empty';
    setProgress(prev => {
      const now = prev.ownedItems?.[itemId] || 0;
      if (now <= 0) return prev;
      return { ...prev, ownedItems: removeItem(prev.ownedItems, itemId) };
    });
    return 'used';
  }, []);

  // Beli pack. Return: 'bought' | 'owned' | 'poor' | 'invalid'
  const buyPack = useCallback((packId) => {
    const pack = getPack(packId);
    if (!pack || !isPackReady(pack)) return 'invalid';
    const owned = progressRef.current?.ownedPacks || [];
    if (owned.includes(packId)) return 'owned';
    const balance = progressRef.current?.medaru || 0;
    if (balance < pack.price) return 'poor';
    setProgress(prev => {
      const ownedNow = prev.ownedPacks || [];
      if (ownedNow.includes(packId)) return prev;
      const bal = prev.medaru || 0;
      if (bal < pack.price) return prev;
      return { ...prev, medaru: bal - pack.price, ownedPacks: [...ownedNow, packId], activePack: packId };
    });
    return 'bought';
  }, []);

  // ON/OFF pack. Return true kalau sekarang aktif.
  const togglePack = useCallback((packId) => {
    let nowActive = false;
    setProgress(prev => {
      const ownedNow = prev.ownedPacks || [];
      if (!ownedNow.includes(packId)) return prev;
      const willActivate = prev.activePack !== packId;
      nowActive = willActivate;
      return { ...prev, activePack: willActivate ? packId : null };
    });
    return nowActive;
  }, []);

  // Undian gacha. count = 1 atau 10.
  // Return { ok, results:[{id,isNew}], refunded }.
  const rollGacha = useCallback((count = 1) => {
    const price = count >= 10 ? GACHA_PRICE_10X : GACHA_PRICE_1X;
    const balance = progressRef.current?.medaru || 0;
    if (balance < price) return { ok: false, reason: 'poor', results: [], refunded: 0 };

    const ownedNow = progressRef.current?.ownedPacks || [];
    const seen = new Set(ownedNow);
    const results = [];
    for (let i = 0; i < count; i++) {
      const id = rollPackId();
      if (!id) break;
      const isNew = !seen.has(id);
      results.push({ id, isNew });
      seen.add(id);
    }
    const refunded = results.filter((r) => !r.isNew).length * DUPLICATE_REFUND;

    setProgress(prev => {
      const bal = prev.medaru || 0;
      if (bal < price) return prev;
      const merged = [...(prev.ownedPacks || [])];
      results.forEach((r) => { if (!merged.includes(r.id)) merged.push(r.id); });
      return { ...prev, medaru: bal - price + refunded, ownedPacks: merged };
    });

    return { ok: true, results, refunded };
  }, []);

  const resetProgress = useCallback(() => {
    localStorage.removeItem('user_progress_v2');
    localStorage.removeItem('item_progress_v2');
    localStorage.removeItem('achievements_unlocked_v2');
    localStorage.removeItem('selected_badges');
    setProgress(DEFAULT_PROGRESS);
    setItemProgress(DEFAULT_ITEM_PROGRESS);
    setAchievements(DEFAULT_ACHIEVEMENTS);
    setSelectedBadges([]);
  }, []);

  return (
    <UserStatsContext.Provider value={{ progress, username, setUsername, addXp, completeQuiz, spendMedaru, buyItem, consumeItem, buyPack, togglePack, rollGacha, resetProgress }}>
      <ItemProgressContext.Provider value={{ itemProgress, weakItems, recordAnswer, forceMasterItem }}>
        <AchievementsContext.Provider value={{ achievements, selectedBadges, setSelectedBadges, ACHIEVEMENT_META }}>
          {children}
        </AchievementsContext.Provider>
      </ItemProgressContext.Provider>
    </UserStatsContext.Provider>
  );
};
