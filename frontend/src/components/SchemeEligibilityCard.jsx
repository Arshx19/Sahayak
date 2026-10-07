import { Link } from 'react-router-dom';
import EligibilityChecklist from './EligibilityChecklist.jsx';

export default function SchemeEligibilityCard({
  scheme,
  evaluation,
  onUploadMissing,
  language = 'en',
}) {
  const isEligible = evaluation ? evaluation.isEligible : scheme.isEligible;
  const checks = evaluation ? evaluation.criteriaChecks : [];
  const missingDocs = evaluation ? evaluation.missingDocuments : [];

  const isState = scheme.provider === 'State' || scheme.provided_by === 'State' || scheme.level === 'State';
  const providerLabel =
    isState
      ? `State Scheme (${scheme.state})`
      : 'Central Government Scheme';

  return (
    <div
      className={`bg-white rounded-lg border transition-all p-5 flex flex-col justify-between space-y-4 shadow-2xs ${
        isEligible
          ? 'border-emerald-300 hover:border-emerald-500 hover:shadow-xs'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-bold">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded border ${
                isState
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              🏛️ {providerLabel}
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {scheme.category}
            </span>
          </div>

          <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
            🗓️ {typeof scheme.timeline === 'object' ? (scheme.timeline?.application_status || scheme.timeline?.application_frequency || 'Continuous') : (scheme.timeline || 'Always Open')}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-extrabold text-base text-slate-900 leading-snug">
            {scheme.name}
          </h3>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            {scheme.shortDesc}
          </p>
        </div>

        {/* Benefits Highlight */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded p-2.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Primary Benefit
            </span>
            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
              💡 {scheme.benefits[0]}
            </p>
          </div>
        )}

        {/* Visual Eligibility Status Box */}
        <div
          className={`rounded-md p-3 space-y-2 border ${
            isEligible
              ? 'bg-emerald-50/50 border-emerald-300'
              : 'bg-rose-50/40 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  isEligible ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isEligible ? '✓' : '✕'}
              </span>
              <span
                className={`font-bold text-xs ${
                  isEligible ? 'text-emerald-950' : 'text-rose-950'
                }`}
              >
                {isEligible
                  ? 'Eligible to Apply (All requirements satisfied)'
                  : `Not Eligible Yet (${missingDocs.length} required items missing)`}
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              {evaluation?.passedCount}/{evaluation?.totalCount} Met
            </span>
          </div>

          {/* Visual criteria checklist */}
          <EligibilityChecklist
            criteriaChecks={checks}
            compact={true}
            onUploadClick={onUploadMissing}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <Link
          to={`/schemes/${scheme.id}`}
          className="font-bold text-[#1b365d] hover:underline"
        >
          View Full Scheme Guidelines →
        </Link>

        {isEligible ? (
          <a
            href={scheme.officialUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded transition shadow-2xs flex items-center gap-1"
          >
            <span>Apply on Portal</span>
            <span>↗</span>
          </a>
        ) : (
          missingDocs.length > 0 &&
          onUploadMissing && (
            <button
              type="button"
              onClick={() => onUploadMissing(missingDocs[0])}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded transition shadow-2xs flex items-center gap-1"
            >
              <span>+ Upload Required Documents</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
