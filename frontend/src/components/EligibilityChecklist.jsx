import { Check, X, AlertCircle } from 'lucide-react';

export default function EligibilityChecklist({ criteriaChecks = [], compact = false, onUploadClick, language = 'en' }) {
  if (!criteriaChecks || criteriaChecks.length === 0) return null;
  const hi = language === 'hi';

  return (
    <div className={`space-y-1.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {criteriaChecks.map((check) => {
        const isPassed = check.passed;
        const isUnverified = check.unverified || check.type === 'UNVERIFIED';

        let badgeBg = 'bg-slate-400 text-white';
        let boxBg = 'bg-slate-50 border-slate-200 text-slate-800';
        let detailColor = 'text-slate-500 font-medium';

        if (isPassed) {
          badgeBg = 'bg-emerald-700 text-white';
          boxBg = 'bg-emerald-50/60 border-emerald-200 text-emerald-950';
          detailColor = 'text-emerald-700';
        } else if (isUnverified) {
          badgeBg = 'bg-amber-600 text-white';
          boxBg = 'bg-amber-50/70 border-amber-200 text-amber-950';
          detailColor = 'text-amber-800 font-medium';
        }

        return (
          <div
            key={check.id}
            className={`flex items-start justify-between gap-2 p-2 rounded border transition ${boxBg}`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 ${badgeBg}`}
                aria-hidden="true"
              >
                {isPassed ? (
                  <Check className="w-2.5 h-2.5" />
                ) : isUnverified ? (
                  <AlertCircle className="w-2.5 h-2.5" />
                ) : (
                  <X className="w-2.5 h-2.5" />
                )}
              </span>
              <div>
                <span className="font-semibold">{check.label}</span>
                {check.detail && (
                  <span className={`block text-[10px] ${detailColor}`}>
                    {check.detail}
                  </span>
                )}
              </div>
            </div>

            {!check.passed && (check.type === 'DOCUMENT' || check.docId) && onUploadClick && (
              <button
                type="button"
                onClick={() => onUploadClick(check.docId)}
                className="shrink-0 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 rounded text-[10px] transition shadow-2xs cursor-pointer"
              >
                {hi ? 'अपलोड' : 'Upload'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
