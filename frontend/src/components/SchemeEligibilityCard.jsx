import { Link } from 'react-router-dom';
import EligibilityChecklist from './EligibilityChecklist.jsx';
import { Building2, Calendar, Award, Check, X, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

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
  const providerLabel = isState ? `State (${scheme.state})` : 'Central Scheme';

  return (
    <div
      className={`bg-white rounded-lg border transition-all p-5 flex flex-col justify-between space-y-4 shadow-2xs ${
        isEligible
          ? 'border-emerald-300 hover:border-emerald-400'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                isState
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>{providerLabel}</span>
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {scheme.category}
            </span>
          </div>

          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>
              {typeof scheme.timeline === 'object'
                ? scheme.timeline?.application_status || scheme.timeline?.application_frequency || 'Continuous'
                : scheme.timeline || 'Always Open'}
            </span>
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 leading-snug">
            {scheme.name}
          </h3>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {scheme.shortDesc}
          </p>
        </div>

        {/* Benefits Highlight */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              <span>Primary Entitlement</span>
            </span>
            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
              {scheme.benefits[0]}
            </p>
          </div>
        )}

        {/* Visual Eligibility Status Box */}
        <div
          className={`rounded-md p-3 space-y-2 border ${
            isEligible
              ? 'bg-emerald-50/50 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  isEligible ? 'bg-emerald-700' : 'bg-slate-400'
                }`}
              >
                {isEligible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </span>
              <span
                className={`font-semibold text-xs ${
                  isEligible ? 'text-emerald-950' : 'text-slate-800'
                }`}
              >
                {isEligible
                  ? 'Eligible to Apply (All criteria satisfied)'
                  : `Requirements Pending (${missingDocs.length} missing items)`}
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
          className="font-semibold text-[#0f2942] hover:underline"
        >
          View Full Scheme Guidelines →
        </Link>

        {isEligible ? (
          <a
            href={scheme.officialUrl || scheme.application_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded transition shadow-2xs flex items-center gap-1.5"
          >
            <span>Apply on Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          missingDocs.length > 0 &&
          onUploadMissing && (
            <button
              type="button"
              onClick={() => onUploadMissing(missingDocs[0])}
              className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white font-semibold px-3 py-1.5 rounded transition shadow-2xs cursor-pointer"
            >
              Upload Documents
            </button>
          )
        )}
      </div>
    </div>
  );
}
