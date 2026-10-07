import { getTranslation } from '../utils/translations.js';

export default function AccessibilityControls({ fontSize, setFontSize, language = 'en' }) {
  const t = (key) => getTranslation(language, key);
  const btn = (size, label, aria) => (
    <button
      onClick={() => setFontSize(size)}
      aria-label={aria}
      aria-pressed={fontSize === size}
      className={`px-1 rounded hover:bg-slate-700 ${fontSize === size ? 'font-bold text-amber-300 underline' : 'text-slate-300'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700" role="group" aria-label="Text size">
      <span className="text-slate-400 mr-1">{t('textSize')}</span>
      {btn('sm', 'A-', 'Decrease text size')}
      {btn('base', 'A', 'Default text size')}
      {btn('lg', 'A+', 'Increase text size')}
    </div>
  );
}
