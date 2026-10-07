import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getProfile, getSchemes } from '../services/api.js';
import { INITIAL_CITIZEN_DOCUMENTS } from '../data/documentsData.js';
import { evaluateAllSchemes } from '../services/eligibilityService.js';
import DocumentManager from '../components/DocumentManager.jsx';
import SchemeEligibilityCard from '../components/SchemeEligibilityCard.jsx';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import LoadingState from '../components/LoadingState.jsx';

export default function CitizenDashboardPage({ language }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [profile, setProfile] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [filterState, setFilterState] = useState('All');
  const [filterProvider, setFilterProvider] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Upload Modal triggered from a scheme card
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetDocId, setTargetDocId] = useState('pan');

  useEffect(() => {
    Promise.all([getProfile(), getSchemes()])
      .then(([prof, scm]) => {
        setProfile(prof);
        setSchemes(scm || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDocumentUploaded = (docId, filePayload) => {
    const updatedDocs = {
      ...documents,
      [docId]: filePayload,
    };
    setDocuments(updatedDocs);
    localStorage.setItem('sahayak_citizen_docs', JSON.stringify(updatedDocs));

    // Evaluate new eligibility impact
    const oldEval = evaluateAllSchemes(schemes, documents, profile || {});
    const newEval = evaluateAllSchemes(schemes, updatedDocs, profile || {});

    const newlyEligible = newEval.eligibleCount - oldEval.eligibleCount;

    if (newlyEligible > 0) {
      addNotification({
        title: `🎉 ${newlyEligible} New Scheme(s) Unlocked!`,
        message: `Uploading ${filePayload.fileName || docId.toUpperCase()} unlocked eligibility for new schemes. You can now apply!`,
        type: 'ELIGIBILITY_UNLOCK',
      });
    } else {
      addNotification({
        title: `Document Uploaded & Verified`,
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

  // Dynamic Batch Evaluation
  const { eligibleSchemes, ineligibleSchemes } = evaluateAllSchemes(
    schemes,
    documents,
    profile || {}
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
    const matchesProvider =
      filterProvider === 'All' ||
      (filterProvider === 'Centre' && s.provided_by === 'Centre') ||
      (filterProvider === 'State' && s.provided_by === 'State');

    // State filter
    const sState = (s.state || '').toLowerCase();
    const matchesState =
      filterState === 'All' ||
      sState.includes('all states') ||
      sState.includes(filterState.toLowerCase());

    // Category filter
    const sCat = (s.category || '').toLowerCase();
    const matchesCategory =
      filterCategory === 'All' || sCat.includes(filterCategory.toLowerCase());

    // Search query
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.shortDesc.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q);

    return matchesProvider && matchesState && matchesCategory && matchesQuery;
  });

  const availableStates = ['All', 'Maharashtra', 'Uttar Pradesh', 'Rajasthan', 'Bihar'];
  const categories = ['All', 'Agriculture', 'Housing', 'Healthcare', 'Women & Child', 'Energy', 'Financial'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Citizen Welcome Banner */}
      <div className="bg-[#1b365d] text-white p-6 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇮🇳</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Citizen Scheme Portal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.name || profile?.name || 'Citizen User'}
          </h2>
          <p className="text-xs text-slate-200">
            State Domicile: <strong className="text-amber-300">{profile?.state || 'Maharashtra'}</strong> • Primary Occupation:{' '}
            <strong className="text-amber-300 capitalize">{profile?.occupation || 'Farmer'}</strong> • Annual Income:{' '}
            <strong className="text-amber-300">{profile?.income || '₹1,20,000'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 border border-white/20 rounded p-2.5 text-center text-xs">
            <span className="text-[10px] text-slate-300 block uppercase font-semibold">Your Eligibility</span>
            <span className="text-base font-extrabold text-emerald-400">
              {eligibleSchemes.length} Schemes Available
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
        <div className="border-b border-slate-300 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#1b365d]">Government Scheme Eligibility</h3>
            <p className="text-xs text-slate-500">
              Evaluated deterministically against your uploaded documents and socio-economic demographics.
            </p>
          </div>

          {/* Scheme Section Tabs */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-bold gap-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('ELIGIBLE')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'ELIGIBLE'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ✓ Eligible to Apply ({eligibleSchemes.length})
            </button>
            <button
              onClick={() => setActiveTab('NOT_ELIGIBLE')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'NOT_ELIGIBLE'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ✕ Needs Documents ({ineligibleSchemes.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'ALL'
                  ? 'bg-[#1b365d] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              All Schemes ({schemes.length})
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 text-[11px] uppercase">Filters:</span>

            {/* Provider Filter */}
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              <option value="All">All Providers (Centre & State)</option>
              <option value="Centre">🏛️ Central Government</option>
              <option value="State">📍 State Government</option>
            </select>

            {/* State Filter */}
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  State: {st === 'All' ? 'Pan-India (All States)' : st}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c === 'All' ? 'All Sectors' : c}
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
              className="w-full border border-slate-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-[#1b365d]"
            />
          </div>
        </div>

        {/* Schemes Cards Grid */}
        {filteredList.length === 0 ? (
          <div className="bg-white border border-slate-300 rounded-lg p-10 text-center space-y-3">
            <span className="text-3xl block">🔍</span>
            <h4 className="font-bold text-base text-slate-800">
              No schemes found in this category
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'ELIGIBLE'
                ? 'You do not currently have all required documents for schemes under these filter settings. Switch to the "Needs Documents" tab to see what documents are required.'
                : 'Try adjusting your state, provider, or category filter.'}
            </p>
            {activeTab === 'ELIGIBLE' && (
              <button
                onClick={() => setActiveTab('NOT_ELIGIBLE')}
                className="bg-[#1b365d] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#122440]"
              >
                View Ineligible Schemes & Missing Documents →
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
