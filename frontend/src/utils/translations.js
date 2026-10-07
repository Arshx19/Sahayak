import { TRANSLATIONS } from '../data/translations.js';

export const getTranslation = (language, key) =>
  TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || key;
