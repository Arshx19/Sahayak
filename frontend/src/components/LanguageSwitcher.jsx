import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ language = 'en', setLanguage }) {
  const isHi = language === 'hi';

  const handleToggle = (lang) => {
    if (typeof setLanguage === 'function') {
      setLanguage(lang);
    }
  };

  return (
    <div
      id="language-switcher"
      className="inline-flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded px-2 py-0.5 shadow-2xs select-none"
      role="group"
      aria-label="Language selection"
    >
      <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-1 text-xs">
        <button
          id="lang-btn-en"
          type="button"
          onClick={() => handleToggle('en')}
          aria-pressed={!isHi}
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
            !isHi
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Switch to English"
        >
          English
        </button>
        <span className="text-slate-600" aria-hidden="true">
          |
        </span>
        <button
          id="lang-btn-hi"
          type="button"
          onClick={() => handleToggle('hi')}
          aria-pressed={isHi}
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
            isHi
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="हिंदी में बदलें"
        >
          हिंदी
        </button>
      </div>
    </div>
  );
}
