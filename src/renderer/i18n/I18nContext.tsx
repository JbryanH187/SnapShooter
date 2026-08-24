import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'snapproof_language';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('es');

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Language;
        if (saved === 'es' || saved === 'en') {
            setLanguageState(saved);
        } else {
            // Detect system language
            const navLang = navigator.language?.toLowerCase();
            if (navLang.startsWith('en')) {
                setLanguageState('en');
            } else {
                setLanguageState('es');
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    };

    const t = useMemo(() => {
        return (key: TranslationKey): string => {
            const dict = translations[language] || translations.es;
            return (dict as any)[key] || (translations.es as any)[key] || key;
        };
    }, [language]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
