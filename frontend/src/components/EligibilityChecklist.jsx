// -----------------------------------------------------------------------------
// EligibilityChecklist Component
// Renders dynamic, accessible visual criteria items with passed (✓) & missing (✗) states.
// Consumes structured criteriaChecks array from eligibilityService.
// -----------------------------------------------------------------------------

export default function EligibilityChecklist({ criteriaChecks = [], compact = false, onUploadClick }) {
  if (!criteriaChecks || criteriaChecks.length === 0) return null;

  return (
    <div className={`space-y-1.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>
      {criteriaChecks.map((check) => (
        <div
          key={check.id}
          className={`flex items-start justify-between gap-2 p-1.5 rounded transition ${
            check.passed
              ? 'bg-emerald-50/70 border border-emerald-200/60 text-emerald-950'
              : 'bg-rose-50/80 border border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-2">
            <span
              className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 ${
                check.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
              aria-hidden="true"
            >
              {check.passed ? '✓' : '✕'}
            </span>
            <div>
              <span className="font-semibold">{check.label}</span>
              {check.detail && (
                <span className={`block text-[10px] ${check.passed ? 'text-emerald-700' : 'text-rose-700 font-medium'}`}>
                  {check.detail}
                </span>
              )}
            </div>
          </div>

          {!check.passed && check.type === 'DOCUMENT' && onUploadClick && (
            <button
              type="button"
              onClick={() => onUploadClick(check.docId)}
              className="shrink-0 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2 py-0.5 rounded text-[10px] transition shadow-2xs"
            >
              Upload +
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
