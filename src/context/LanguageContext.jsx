import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('ui_language') || 'en';
  });

  // Pilih bahasa secara eksplisit ('en' | 'id') — dipakai di halaman Settings.
  const setLanguage = (lang) => {
    const next = lang === 'id' ? 'id' : 'en';
    localStorage.setItem('ui_language', next);
    setLanguageState(next);
  };

  // Toggle cepat (EN ⇄ ID).
  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'id' : 'en';
      localStorage.setItem('ui_language', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
