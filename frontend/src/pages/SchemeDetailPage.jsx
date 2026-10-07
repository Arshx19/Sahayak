import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getSchemeById, getProfile } from '../services/api.js';
import { INITIAL_CITIZEN_DOCUMENTS } from '../data/documentsData.js';
import { evaluateSchemeEligibility } from '../services/eligibilityService.js';
import EligibilityChecklist from '../components/EligibilityChecklist.jsx';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { Building2, Calendar, Check, X, ExternalLink, ArrowLeft, UploadCloud } from 'lucide-react';

export default function SchemeDetailPage({ language }) {
  const { schemeId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();

  const [scheme, setScheme] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('sahayak_citizen_docs');
      return saved ? JSON.parse(saved) : INITIAL_CITIZEN_DOCUMENTS;
    } catch {
      return INITIAL_CITIZEN_DOCUMENTS;
    }
  });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetDocId, setTargetDocId] = useState('aadhaar');

  useEffect(() => {
    setScheme(null);
    Promise.all([getSchemeById(schemeId), getProfile()])
      .then(([s, p]) => {
        setScheme(s);
        setProfile(p);
      })
      .catch(() => {});
  }, [schemeId]);

  const handleDocumentUploaded = (docId, filePayload) => {
    const updatedDocs = {
      ...documents,
      [docId]: filePayload,
    };
    setDocuments(updatedDocs);
    localStorage.setItem('sahayak_citizen_docs', JSON.stringify(updatedDocs));

    addNotification({
      title: 'Document Verified',
      message: `${filePayload.fileName || docId.toUpperCase()} verified. Eligibility updated!`,
      type: 'DOCUMENT_VERIFIED',
    });
  };

  const handleUploadMissing = (docId) => {
    setTargetDocId(docId);
    setUploadModalOpen(true);
  };

  if (!scheme) return <LoadingState />;

  const evaluation = evaluateSchemeEligibility(scheme, documents, profile || {});
  const isEligible = evaluation.isEligible;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Back button */}
      <Link
        to="/schemes"
        className="text-xs font-semibold text-[#0f2942] hover:underline inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Schemes</span>
      </Link>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 sm:p-6 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {(() => {
            const isState = scheme.provider === 'State' || scheme.provided_by === 'State' || scheme.level === 'State';
            return (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                    isState
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isState ? `State Scheme (${scheme.state})` : 'Central Scheme'}</span>
                </span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {scheme.category}
                </span>
              </div>
            );
          })()}

          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-950 border border-amber-200 px-2.5 py-0.5 rounded text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-800" />
            <span>{typeof scheme.timeline === 'object' ? (scheme.timeline?.application_status || scheme.timeline?.application_frequency || 'Continuous') : (scheme.timeline || 'Open All Year Round')}</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f2942] leading-snug">
          {scheme.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {scheme.fullDesc || scheme.shortDesc}
        </p>
      </div>

      {/* YOUR ELIGIBILITY STATUS SECTION */}
      <div
        className={`rounded-lg border p-5 space-y-3 shadow-2xs ${
          isEligible
            ? 'bg-emerald-50/60 border-emerald-300'
            : 'bg-rose-50/50 border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                isEligible ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {isEligible ? <Check className="w-3.5 h-3.5 text-white" /> : <X className="w-3.5 h-3.5 text-white" />}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isEligible
                  ? 'You are Eligible to Apply for this Scheme'
                  : 'You Are Not Currently Eligible Yet'}
              </h2>
              <p className="text-xs text-slate-600">
                {isEligible
                  ? 'All required verification documents and demographic criteria are satisfied.'
                  : `${evaluation.missingDocuments.length} required document(s) or criteria are not satisfied.`}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-300">
            {evaluation.passedCount} / {evaluation.totalCount} Conditions Met
          </span>
        </div>

        {/* Dynamic Criteria Breakdown */}
        <div className="pt-2">
          <EligibilityChecklist
            criteriaChecks={evaluation.criteriaChecks}
            compact={false}
            onUploadClick={handleUploadMissing}
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200/80">
          <span className="text-xs text-slate-500">
            {isEligible
              ? 'Ready to proceed to official government application portal'
              : 'Upload the missing document(s) above to become eligible'}
          </span>

          {isEligible ? (
            <a
              href={scheme.officialUrl || scheme.application_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded text-xs transition shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            evaluation.missingDocuments.length > 0 && (
              <button
                type="button"
                onClick={() => handleUploadMissing(evaluation.missingDocuments[0])}
                className="bg-[#0f2942] hover:bg-[#1a3b5c] text-white font-semibold px-4 py-2 rounded text-xs transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Missing Documents Now</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Scheme Key Benefits */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-3 shadow-2xs">
        <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider border-b border-slate-200 pb-2">
          Key Entitlements & Benefits
        </h3>
        <ul className="space-y-2 text-xs text-slate-700">
          {(scheme.benefits || []).map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* How to Apply */}
      {scheme.how_to_apply && (
        <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-2 shadow-2xs">
          <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider border-b border-slate-200 pb-2">
            Application Procedure
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {scheme.how_to_apply}
          </p>
          {scheme.officialUrl && (
            <div className="pt-2">
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0f2942] hover:underline inline-flex items-center gap-1"
              >
                <span>Visit Official Government Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-600" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        initialDocId={targetDocId}
        onUploadSuccess={handleDocumentUploaded}
      />
    </div>
  );
}
