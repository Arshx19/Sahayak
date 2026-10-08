import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getProfile, getSchemes, getUserDocuments, uploadUserDocument, evaluateProfileWithEngine } from '../services/api.js';
import { INITIAL_CITIZEN_DOCUMENTS } from '../data/documentsData.js';
import { evaluateAllSchemes } from '../services/eligibilityService.js';
import DocumentManager from '../components/DocumentManager.jsx';
import SchemeEligibilityCard from '../components/SchemeEligibilityCard.jsx';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { CheckCircle2, AlertCircle, Search, Landmark, ShieldCheck } from 'lucide-react';

export default function CitizenDashboardPage({ language }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [profile, setProfile] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverEvaluations, setServerEvaluations] = useState(null);

  // Citizen Documents State (persisted per session)
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('sahayak_citizen_docs');
      return saved ? JSON.parse(saved) : INITIAL_CITIZEN_DOCUMENTS;
    } catch {
      return INITIAL_CITIZEN_DOCUMENTS;
    }
  });

  // Filter States
  const [activeTab, setActiveTab] = useState('ELIGIBLE'); // 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ALL'
  const [filterState, setFilterState] = useState('All States');
  const [filterProvider, setFilterProvider] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Upload Modal triggered from a scheme card
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetDocId, setTargetDocId] = useState('pan');

  useEffect(() => {
    Promise.all([getProfile(), getSchemes(), getUserDocuments()])
      .then(([prof, scm, docs]) => {
        setProfile(prof);
        setSchemes(scm || []);
        if (docs && Object.keys(docs).length > 0) {
          setDocuments((prev) => ({ ...prev, ...docs }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sync with AI Rules Engine whenever documents or profile change
  useEffect(() => {
    let isMounted = true;
    const syncRulesEngine = async () => {
      try {
        const docList = Object.entries(documents || {}).map(([docType, doc]) => ({
          doc_type: docType,
          fields: doc.extractedFields || {},
          needs_review: doc.needsReview || [],
          validation_errors: doc.validationErrors || [],
        }));
        const res = await evaluateProfileWithEngine({
          extractedDocuments: docList,
          supplementalProfile: profile || {},
        });
        if (isMounted && res?.evaluations) {
          const evalMap = {};
          res.evaluations.forEach((ev) => {
            if (ev.scheme_id) {
              evalMap[ev.scheme_id.toLowerCase()] = ev;
              evalMap[ev.scheme_id] = ev;
            }
          });
          setServerEvaluations(evalMap);
        }
      } catch (err) {
        console.warn('Backend rules engine offline, continuing with local evaluator');
      }
    };

    if (schemes.length > 0) {
      syncRulesEngine();
    }
    return () => { isMounted = false; };
  }, [documents, profile, schemes.length]);

  const handleDocumentUploaded = (docId, filePayload) => {
    const updatedDocs = {
      ...documents,
      [docId]: filePayload,
    };
    setDocuments(updatedDocs);
    localStorage.setItem('sahayak_citizen_docs', JSON.stringify(updatedDocs));

    // Asynchronously sync with backend if running
    uploadUserDocument({
      document_type: docId,
      document_name: filePayload.fileName,
      document_number: filePayload.number,
      file_name: filePayload.fileName,
      verification_status: filePayload.status?.toLowerCase() || 'verified',
    }).catch(() => {});

    // Evaluate new eligibility impact
    const oldEval = evaluateAllSchemes(schemes, documents, profile || {}, serverEvaluations);
    const newEval = evaluateAllSchemes(schemes, updatedDocs, profile || {}, serverEvaluations);

    const newlyEligible = newEval.eligibleCount - oldEval.eligibleCount;

    if (newlyEligible > 0) {
      addNotification({
        title: `${newlyEligible} Scheme(s) Unlocked`,
        message: `Uploading ${filePayload.fileName || docId.toUpperCase()} unlocked eligibility for new welfare schemes. You can now apply!`,
        type: 'SCHEME_NEW',
      });
    } else {
      addNotification({
        title: 'Document Uploaded & Verified',
        message: `${filePayload.fileName || docId.toUpperCase()} has been uploaded and verified successfully.`,
        type: 'DOCUMENT_VERIFIED',
      });
    }
  };

  const handleOpenUploadForDoc = (docId) => {
    setTargetDocId(docId);
    setUploadModalOpen(true);
  };

  if (loading) return <LoadingState />;

  // Dynamic Batch Evaluation (utilizing server AI engine when ready)
  const { eligibleSchemes, ineligibleSchemes } = evaluateAllSchemes(
    schemes,
    documents,
    profile || {},
    serverEvaluations
  );

  // Tab Filtering
  let displayedSchemes = [];
  if (activeTab === 'ELIGIBLE') {
    displayedSchemes = eligibleSchemes;
  } else if (activeTab === 'NOT_ELIGIBLE') {
    displayedSchemes = ineligibleSchemes;
  } else {
    displayedSchemes = [...eligibleSchemes, ...ineligibleSchemes];
  }

  // Multi-Criteria Filtering
  const filteredList = displayedSchemes.filter((s) => {
    // Provider filter
    const isCentral = s.provider === 'Central' || s.provided_by === 'Central' || s.provided_by === 'Centre' || s.level === 'Central';
    const isState = s.provider === 'State' || s.provided_by === 'State' || s.level === 'State';
    const matchesProvider =
      filterProvider === 'All' ||
      ((filterProvider === 'Centre' || filterProvider === 'Central') && isCentral) ||
      (filterProvider === 'State' && isState);

    // State filter
    const sState = (s.state || '').toLowerCase();
    const targetState = filterState.toLowerCase();
    const matchesState =
      filterState === 'All' ||
      filterState === 'All States' ||
      sState === targetState ||
      sState.includes(targetState) ||
      (Array.isArray(s.applicable_states) && !s.applicable_states.includes('ALL') && s.applicable_states.some((st) => st.toLowerCase() === targetState));

    // Category filter
    const sCat = (s.category || '').toLowerCase();
    const matchesCategory =
      filterCategory === 'All' || sCat.includes(filterCategory.toLowerCase());

    // Search query
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.shortDesc || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q);

    return matchesProvider && matchesState && matchesCategory && matchesQuery;
  });

  const availableStates = ['All States', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Odisha'];
  const categories = ['All', 'Farmer', 'Women', 'Healthcare', 'Housing', 'Employment', 'MSME', 'Education', 'Social Welfare', 'Financial Assistance'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Citizen Welcome Banner */}
      <div className="bg-[#0f2942] text-white p-6 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
              Citizen Entitlement Dashboard
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {user?.name || profile?.name || 'Citizen'}
          </h2>
          <p className="text-xs text-slate-300">
            Declared Domicile: <strong className="text-amber-300">{profile?.state || 'Maharashtra'}</strong>
            {profile?.occupation && (
              <> • Primary Occupation: <strong className="text-amber-300 capitalize">{profile.occupation}</strong></>
            )}
            {profile?.annual_income > 0 && (
              <> • Declared Income: <strong className="text-amber-300">₹{Number(profile.annual_income).toLocaleString('en-IN')}</strong></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/10 border border-white/20 rounded-md p-3 text-center text-xs">
            <span className="text-[10px] text-slate-300 block uppercase font-semibold">Your Eligibility</span>
            <span className="text-base font-extrabold text-emerald-400">
              {eligibleSchemes.length} Schemes Ready
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Document Locker & Upload */}
      <DocumentManager
        documents={documents}
        onDocumentUploaded={handleDocumentUploaded}
        language={language}
      />

      {/* SECTION 2: Schemes Eligibility Overview & Tabs */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Personal Scheme Entitlements & Applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live eligibility calculated against your verified documents locker.
            </p>
          </div>

          {/* Scheme Section Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold gap-1 self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('ELIGIBLE')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'ELIGIBLE'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Eligible to Apply ({eligibleSchemes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('NOT_ELIGIBLE')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'NOT_ELIGIBLE'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Action Required ({ineligibleSchemes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#0f2942] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              All Programs ({schemes.length})
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 text-[11px] uppercase">Filters:</span>

            {/* Provider Filter */}
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#0f2942] bg-white font-medium"
            >
              <option value="All">All Levels</option>
              <option value="Central">Central Government</option>
              <option value="State">State Government</option>
            </select>

            {/* State Filter */}
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#0f2942] bg-white font-medium"
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#0f2942] bg-white font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-60">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheme name..."
              className="w-full border border-slate-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-[#0f2942]"
            />
          </div>
        </div>

        {/* Schemes Cards Grid */}
        {filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-base text-slate-800">
              No schemes found in this category
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'ELIGIBLE'
                ? 'You do not currently have all required documents for schemes under these filter settings. Switch to the "Action Required" tab to see what documents are required.'
                : 'Try adjusting your state, provider, or category filter.'}
            </p>
            {activeTab === 'ELIGIBLE' && (
              <button
                onClick={() => setActiveTab('NOT_ELIGIBLE')}
                className="bg-[#0f2942] text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-[#1e3a5f] cursor-pointer"
              >
                View Pending Schemes & Missing Documents →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((scheme) => (
              <SchemeEligibilityCard
                key={scheme.id}
                scheme={scheme}
                evaluation={scheme.evaluation}
                onUploadMissing={handleOpenUploadForDoc}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Upload Modal Triggered from Schemes Cards */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        initialDocId={targetDocId}
        onUploadSuccess={handleDocumentUploaded}
      />
    </div>
  );
}
