import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'vi';
  });

  const setLanguage = (lang) => {
    const validLang = lang === 'en' ? 'en' : 'vi';
    setLanguageState(validLang);
    localStorage.setItem('lang', validLang);
  };

  const t = (key, replacements = {}) => {
    const textMap = translations[language] || translations.vi;
    let value = textMap[key];
    
    if (value === undefined) {
      // Fallback to Vietnamese if key not found in English
      value = translations.vi[key];
    }
    
    if (value === undefined) {
      return key;
    }

    // Replace place holders like {limit} with replacements.limit
    let result = value;
    Object.entries(replacements).forEach(([placeholder, repVal]) => {
      result = result.replace(`{${placeholder}}`, repVal);
    });
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
