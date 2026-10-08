import { Check, X } from 'lucide-react';

export default function EligibilityChecklist({ criteriaChecks = [], compact = false, onUploadClick, language = 'en' }) {
  if (!criteriaChecks || criteriaChecks.length === 0) return null;
  const hi = language === 'hi';

  return (
    <div className={`space-y-1.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {criteriaChecks.map((check) => (
        <div
          key={check.id}
          className={`flex items-start justify-between gap-2 p-2 rounded transition ${
            check.passed
              ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-2">
            <span
              className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 ${
                check.passed ? 'bg-emerald-700 text-white' : 'bg-slate-400 text-white'
              }`}
              aria-hidden="true"
            >
              {check.passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </span>
            <div>
              <span className="font-semibold">{check.label}</span>
              {check.detail && (
                <span className={`block text-[10px] ${check.passed ? 'text-emerald-700' : 'text-slate-500 font-medium'}`}>
                  {check.detail}
                </span>
              )}
            </div>
          </div>

          {!check.passed && check.type === 'DOCUMENT' && onUploadClick && (
            <button
              type="button"
              onClick={() => onUploadClick(check.docId)}
              className="shrink-0 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2 py-0.5 rounded text-[10px] transition shadow-2xs cursor-pointer"
            >
              {hi ? 'अपलोड' : 'Upload'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
