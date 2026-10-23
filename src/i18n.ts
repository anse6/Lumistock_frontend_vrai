import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ar-ma';

import translationFR from './locales/fr/translation.json';
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationDE from './locales/de/translation.json';
import translationZH from './locales/zh/translation.json';
import translationAR from './locales/ar/translation.json';
import { LANGUES, langueDe } from './langues';

const resources = {
  fr: { translation: translationFR },
  en: { translation: translationEN },
  es: { translation: translationES },
  de: { translation: translationDE },
  zh: { translation: translationZH },
  ar: { translation: translationAR },
};

// Langue mémorisée (ou français par défaut)
const lireLangue = () => {
  try {
    return localStorage.getItem('app-language') || 'fr';
  } catch {
    return 'fr';
  }
};
const savedLanguage = langueDe(lireLangue()).code;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    supportedLngs: LANGUES.map((l) => l.code),
    // Texte absent d'une langue : anglais, puis français.
    fallbackLng: (code) => (code === 'fr' ? ['fr'] : ['en', 'fr']),
    interpolation: {
      escapeValue: false
    }
  });

// Langue et sens d'écriture de la page (arabe : de droite à gauche), dates dayjs.
const majLangueDocument = (lng: string) => {
  const langue = langueDe(lng);
  document.documentElement.setAttribute('lang', langue.code);
  document.documentElement.setAttribute('dir', langue.rtl ? 'rtl' : 'ltr');
  dayjs.locale(langue.dayjs);
};
majLangueDocument(i18n.language || savedLanguage);
i18n.on('languageChanged', majLangueDocument);

/** Change la langue de l'application et la mémorise. */
export const changerLangue = (code: string) => {
  const langue = langueDe(code).code;
  i18n.changeLanguage(langue);
  try {
    localStorage.setItem('app-language', langue);
  } catch {
    /* préférence non mémorisée (navigation privée) */
  }
};

export default i18n;
