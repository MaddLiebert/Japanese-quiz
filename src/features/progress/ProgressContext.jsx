import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Fungsi ini jagoan buat ngambil tanggal LOKAL HP/Laptop (YYYY-MM-DD)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- USER STATS CONTEXT ---
const UserStatsContext = createContext(null);
export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) throw new Error('useUserStats must be used within a ProgressProvider');
  return context;
};

const DEFAULT_PROGRESS = {
  xp: 0,
  level: 1,
  accuracy: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  maxStreak: 0,
  lastActiveDate: getLocalDateString()
};

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
  first_quiz: { label: '初', title: 'First Quiz' },
  '100_xp': { label: '百', title: '100 XP' },
  clean_up: { label: '清', title: 'Clean Slate' },
};

export const ProgressProvider = ({ children }) => {
  // 1. User Stats State
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('user_progress_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PROGRESS;
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });

  // 2. Item Progress State
  const [itemProgress, setItemProgress] = useState(() => {
    const saved = localStorage.getItem('item_progress_v2');
    return saved ? JSON.parse(saved) : DEFAULT_ITEM_PROGRESS;
  });

  // 3. Achievements State
  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('achievements_unlocked_v2');
    return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
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

      if (progress.totalAnswered > 0) add('first_quiz');
      if (progress.xp >= 100) add('100_xp');
      // "clean_up" dihitung jika weakItems 0 setelah user menjawab lebih dari 10 soal
      if (weakItems.length === 0 && progress.totalAnswered > 10) add('clean_up');

      return next;
    });
  }, [progress.totalAnswered, progress.xp, weakItems.length]);

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const addXp = useCallback((amount) => {
    setProgress(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
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

  const recordAnswer = useCallback((itemId, isCorrect) => {
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
       addXp(10);
    }
  }, [addXp]);

  const forceMasterItem = useCallback((itemId) => {
     const today = getLocalDateString();
     setItemProgress(prev => ({
        ...prev,
        [itemId]: {
          correctCount: (prev[itemId]?.correctCount || 0) + 3,
          incorrectCount: prev[itemId]?.incorrectCount || 0,
          streak: 3,
          lastReviewed: today,
          nextReview: getLocalDateString(new Date(Date.now() + 86400000 * 8)), // 8 hari lagi
          status: 'mastered'
        }
     }));
  }, []);

  const resetProgress = useCallback(() => {
    localStorage.removeItem('user_progress_v2');
    localStorage.removeItem('item_progress_v2');
    localStorage.removeItem('achievements_unlocked_v2');
    setProgress(DEFAULT_PROGRESS);
    setItemProgress(DEFAULT_ITEM_PROGRESS);
    setAchievements(DEFAULT_ACHIEVEMENTS);
  }, []);

  return (
    <UserStatsContext.Provider value={{ progress, username, setUsername, addXp, resetProgress }}>
      <ItemProgressContext.Provider value={{ itemProgress, weakItems, recordAnswer, forceMasterItem }}>
        <AchievementsContext.Provider value={{ achievements, ACHIEVEMENT_META }}>
          {children}
        </AchievementsContext.Provider>
      </ItemProgressContext.Provider>
    </UserStatsContext.Provider>
  );
};
