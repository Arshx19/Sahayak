import { getTranslation } from '../utils/translations.js';

export default function SchemeCard({ scheme, language, onViewDetails }) {
  const t = (key) => getTranslation(language, key);
  const hi = language === 'hi';

  return (
    <div className="bg-white border border-slate-300 rounded p-4 flex flex-col justify-between space-y-3 hover:border-[#1b365d] shadow-2xs transition-all">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {hi ? scheme.hiLevel : scheme.level} {hi ? 'योजना' : 'Scheme'}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {hi ? scheme.hiState : scheme.state}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 text-sm">{hi ? scheme.hiName : scheme.name}</h3>
        <p className="text-xs text-slate-600 line-clamp-2">{hi ? scheme.hiShortDesc : scheme.shortDesc}</p>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">{hi ? scheme.hiCategory : scheme.category}</span>
        <button onClick={() => onViewDetails(scheme.id)} className="text-xs font-bold text-[#1b365d] hover:underline">
          {t('viewDetails')}
        </button>
      </div>
    </div>
  );
}
