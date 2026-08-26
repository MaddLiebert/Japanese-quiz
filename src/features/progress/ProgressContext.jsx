import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProgressContext = createContext(null);

const DEFAULT_PROGRESS = {
  xp: 0,
  level: 1,
  accuracy: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  maxStreak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0]
};

const DEFAULT_MASTERY = { hiragana: {}, katakana: {}, kotoba: {}, grammar: {}, kanji: {} };
const DEFAULT_WEAK_ITEMS = [];
const DEFAULT_ACHIEVEMENTS = [];

const ACHIEVEMENT_META = {
  first_quiz:  { label: '初', title: 'First Quiz' },
  '100_xp':   { label: '百', title: '100 XP' },
  clean_up:   { label: '清', title: 'Clean Slate' },
};

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('user_progress');
    return saved ? JSON.parse(saved) : DEFAULT_PROGRESS;
  });

  const [masteryData, setMasteryData] = useState(() => {
    const saved = localStorage.getItem('mastery_data');
    const parsed = saved ? JSON.parse(saved) : {};
    // Spread DEFAULT_MASTERY last so any new keys (e.g. 'kanji') are always present,
    // but merge saved sub-objects so existing progress is preserved.
    return {
      ...DEFAULT_MASTERY,
      ...parsed,
      // Ensure every key from DEFAULT_MASTERY exists (handles users with old localStorage)
      ...Object.fromEntries(
        Object.keys(DEFAULT_MASTERY).map(k => [k, { ...(DEFAULT_MASTERY[k]), ...(parsed[k] || {}) }])
      )
    };
  });

  const [weakItems, setWeakItems] = useState(() => {
    const saved = localStorage.getItem('weak_items');
    return saved ? JSON.parse(saved) : DEFAULT_WEAK_ITEMS;
  });

  const [achievements, setAchievements] = useState(() => {
    const saved = localStorage.getItem('achievements_unlocked');
    return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
  });

  useEffect(() => {
    localStorage.setItem('user_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('mastery_data', JSON.stringify(masteryData));
  }, [masteryData]);

  useEffect(() => {
    localStorage.setItem('weak_items', JSON.stringify(weakItems));
  }, [weakItems]);

  useEffect(() => {
    localStorage.setItem('achievements_unlocked', JSON.stringify(achievements));
  }, [achievements]);

  const checkAchievements = useCallback(() => {
    setAchievements(prev => {
      const next = [...prev];
      const add = (id) => { if (!next.includes(id)) next.push(id); };

      if (progress.totalAnswered > 0) add('first_quiz');
      if (progress.xp >= 100) add('100_xp');
      if (weakItems.length === 0 && progress.totalAnswered > 0) add('clean_up');

      return next;
    });
  }, [progress, weakItems]);

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const addXp = (amount) => {
    setProgress(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      
      const today = new Date().toISOString().split('T')[0];
      let newStreak = prev.streak || 0;
      let newMaxStreak = prev.maxStreak || 0;
      
      if (prev.lastActiveDate !== today) {
        const lastDate = new Date(prev.lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
        
        if (newStreak > newMaxStreak) {
          newMaxStreak = newStreak;
        }
      } else if (prev.streak === 0) {
        // First activity ever today
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
  };

  const resetProgress = useCallback(() => {
    localStorage.removeItem('user_progress');
    localStorage.removeItem('mastery_data');
    localStorage.removeItem('weak_items');
    localStorage.removeItem('achievements_unlocked');
    setProgress(DEFAULT_PROGRESS);
    setMasteryData(DEFAULT_MASTERY);
    setWeakItems(DEFAULT_WEAK_ITEMS);
    setAchievements(DEFAULT_ACHIEVEMENTS);
  }, []);

  return (
    <ProgressContext.Provider value={{
      progress, masteryData, weakItems, achievements, ACHIEVEMENT_META,
      addXp, setProgress, setMasteryData, setWeakItems, resetProgress
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
