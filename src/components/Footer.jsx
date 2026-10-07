import { getTranslation } from '../utils/translations.js';

export default function Footer({ language }) {
  const t = (key) => getTranslation(language, key);

  return (
    <footer className="bg-[#1b365d] text-slate-300 border-t border-slate-700 text-xs py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p className="font-bold text-amber-400">{t('footerTitle')}</p>
        <p className="text-[11px] text-slate-400">{t('footerCopyright')}</p>
      </div>
    </footer>
  );
}
