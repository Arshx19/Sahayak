import { getTranslation } from '../utils/translations.js';
import { Check, X } from 'lucide-react';

// result: 'ELIGIBLE' | 'INELIGIBLE'
export default function EligibilityCard({ result, language }) {
  const t = (key) => getTranslation(language, key);

  if (result === 'ELIGIBLE') {
    return (
      <div className="bg-emerald-50 border border-emerald-300 p-4 rounded space-y-2" role="status">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
            <Check className="w-3.5 h-3.5 text-white" />
          </span>
          <h4 className="font-bold text-emerald-950 text-sm">{t('eligibleResultTitle')}</h4>
        </div>
        <p className="text-xs text-emerald-900">{t('eligibleResultDesc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 border border-rose-300 p-4 rounded space-y-3" role="status">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
          <X className="w-3.5 h-3.5 text-white" />
        </span>
        <h4 className="font-bold text-rose-950 text-sm">{t('ineligibleResultTitle')}</h4>
      </div>
      <div className="text-xs text-rose-900 space-y-1">
        <p><strong>{t('ineligibleReason')}</strong></p>
      </div>
    </div>
  );
}
