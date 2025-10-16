import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import axios from 'axios';

// English translations
import commonEN from './en/common.json';
import homeEN from './en/home.json';
import aboutEN from './en/about.json';
import coachingEN from './en/coaching.json';
import quizEN from './en/quiz.json';

// Chinese Simplified
import aboutCN from './zh-CN/about.json';
import commonCN from './zh-CN/common.json';

// Chinese Traditional
import aboutTW from './zh-TW/about.json';
import commonTW from './zh-TW/common.json';

const TRANSLATE_API = import.meta.env.VITE_TRANSLATE_API || 'https://libretranslate.com';

// Auto-translate helper
export const translateAndCache = async (
  ns: string,
  key: string,
  enString: string,
  targetLang: string
): Promise<string> => {
  const cacheKey = `translation_${ns}_${key}_${targetLang}`;
  
  // Check localStorage cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.post(`${TRANSLATE_API}/translate`, {
      q: enString,
      source: 'en',
      target: targetLang === 'zh-TW' ? 'zh' : 'zh',
      format: 'text',
    });

    const translated = response.data.translatedText;
    localStorage.setItem(cacheKey, translated);
    
    // Add to i18n resources
    i18n.addResourceBundle(targetLang, ns, { [key]: translated }, true, true);
    
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    return enString; // Fallback to English
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEN,
        home: homeEN,
        about: aboutEN,
        coaching: coachingEN,
        quiz: quizEN,
      },
      'zh-CN': {
        common: commonCN,
        about: aboutCN,
      },
      'zh-TW': {
        common: commonTW,
        about: aboutTW,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-TW', 'zh-CN'],
    ns: ['common', 'home', 'about', 'coaching', 'quiz'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['cookie', 'navigator', 'localStorage'],
      caches: ['cookie', 'localStorage'],
    },
  });

export default i18n;
