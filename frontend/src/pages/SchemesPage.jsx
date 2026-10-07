import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getSchemes, getProfile } from '../services/api.js';
import { INITIAL_CITIZEN_DOCUMENTS } from '../data/documentsData.js';
import { evaluateAllSchemes } from '../services/eligibilityService.js';
import SchemeEligibilityCard from '../components/SchemeEligibilityCard.jsx';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import LoadingState from '../components/LoadingState.jsx';

const CATEGORIES = [
  'All',
  'Farmer',
  'Women',
  'Healthcare',
  'Housing',
  'Employment',
  'MSME',
  'Education',
  'Social Welfare',
  'Financial Assistance',
];

const AVAILABLE_STATES = [
  'All States',
  'Uttar Pradesh',
  'Maharashtra',
  'Karnataka',
  'Odisha',
];

export default function SchemesPage({ language }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [schemes, setSchemes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('sahayak_citizen_docs');
      return saved ? JSON.parse(saved) : INITIAL_CITIZEN_DOCUMENTS;
    } catch {
      return INITIAL_CITIZEN_DOCUMENTS;
    }
  });

  // Filter States
  const [filterEligibility, setFilterEligibility] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'NOT_ELIGIBLE'
  const [filterProvider, setFilterProvider] = useState('All');
  const [filterState, setFilterState] = useState('All States');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal for missing docs
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetDocId, setTargetDocId] = useState('pan');

  useEffect(() => {
    Promise.all([getSchemes(), getProfile()])
      .then(([sc, pr]) => {
        setSchemes(sc || []);
        setProfile(pr);
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

    addNotification({
      title: 'Document Verified',
      message: `${filePayload.fileName || docId.toUpperCase()} uploaded. Scheme eligibility updated!`,
      type: 'DOCUMENT_VERIFIED',
    });
  };

  const handleUploadMissing = (docId) => {
    setTargetDocId(docId);
    setUploadModalOpen(true);
  };

  const resetFilters = () => {
    setFilterEligibility('ALL');
    setFilterProvider('All');
    setFilterState('All States');
    setFilterCategory('All');
    setSearchQuery('');
  };

  if (loading) return <LoadingState />;

  // Dynamic evaluation
  const { eligibleSchemes, ineligibleSchemes } = evaluateAllSchemes(
    schemes,
    documents,
    profile || {}
  );

  const evaluatedAll = schemes.map((s) => {
    const isEligible = eligibleSchemes.some((e) => e.id === s.id);
    const full = isEligible
      ? eligibleSchemes.find((e) => e.id === s.id)
      : ineligibleSchemes.find((ie) => ie.id === s.id);
    return full || s;
  });

  const filteredSchemes = evaluatedAll.filter((s) => {
    // Eligibility Filter
    if (filterEligibility === 'ELIGIBLE' && !s.isEligible) return false;
    if (filterEligibility === 'NOT_ELIGIBLE' && s.isEligible) return false;

    // Provider / Level filter
    if (filterProvider !== 'All') {
      const isCentral = s.provider === 'Central' || s.provided_by === 'Central' || s.provided_by === 'Centre' || s.level === 'Central';
      const isState = s.provider === 'State' || s.provided_by === 'State' || s.level === 'State';
      if (filterProvider === 'Central' && !isCentral) return false;
      if (filterProvider === 'State' && !isState) return false;
    }

    // State filter
    if (filterState !== 'All States' && filterState !== 'All') {
      const sState = (s.state || '').toLowerCase();
      const targetState = filterState.toLowerCase();
      const matchesState =
        sState === targetState ||
        sState.includes(targetState) ||
        (Array.isArray(s.applicable_states) && !s.applicable_states.includes('ALL') && s.applicable_states.some((st) => st.toLowerCase() === targetState));
      if (!matchesState) {
        return false;
      }
    }

    // Category filter
    if (filterCategory !== 'All') {
      const sCat = (s.category || '').toLowerCase();
      const targetCat = filterCategory.toLowerCase();
      if (!sCat.includes(targetCat) && !targetCat.includes(sCat)) {
        return false;
      }
    }

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (
      q &&
      !s.name.toLowerCase().includes(q) &&
      !(s.shortDesc || '').toLowerCase().includes(q) &&
      !s.id.toLowerCase().includes(q)
    ) {
      return false;
    }

    return true;
  });

  const isFiltered =
    filterEligibility !== 'ALL' ||
    filterProvider !== 'All' ||
    (filterState !== 'All States' && filterState !== 'All') ||
    filterCategory !== 'All' ||
    searchQuery !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Page Title & Search Header */}
      <div className="border-b border-slate-300 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b365d] tracking-tight">
            Government Scheme Directory
          </h1>
          <p className="text-xs text-slate-600">
            Browse all Central and State schemes with live eligibility checks based on your verified documents.
          </p>
        </div>

        <div className="w-full md:w-80 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemes by name or code..."
            className="w-full border border-slate-300 rounded px-3.5 py-2 text-xs focus:outline-none focus:border-[#1b365d] pl-8 shadow-2xs"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3.5 shadow-2xs">
        {/* Eligibility Status Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-500 text-[11px] uppercase mr-1">Eligibility:</span>
            <button
              onClick={() => setFilterEligibility('ALL')}
              className={`px-3 py-1 rounded-full border transition ${
                filterEligibility === 'ALL'
                  ? 'bg-[#1b365d] text-white border-[#1b365d]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Schemes ({schemes.length})
            </button>
            <button
              onClick={() => setFilterEligibility('ELIGIBLE')}
              className={`px-3 py-1 rounded-full border transition ${
                filterEligibility === 'ELIGIBLE'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✓ Eligible to Apply ({eligibleSchemes.length})
            </button>
            <button
              onClick={() => setFilterEligibility('NOT_ELIGIBLE')}
              className={`px-3 py-1 rounded-full border transition ${
                filterEligibility === 'NOT_ELIGIBLE'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ✕ Needs Documents ({ineligibleSchemes.length})
            </button>
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-rose-700 hover:text-rose-900 font-bold hover:underline"
            >
              Clear All Filters ✕
            </button>
          )}
        </div>

        {/* Dropdowns Row: Provider, State, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Provided By
            </label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              <option value="All">All Levels</option>
              <option value="Central">Central Government</option>
              <option value="State">State Government</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Applicable State
            </label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              {AVAILABLE_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 w-full text-slate-600 text-xs flex items-center justify-between">
              <span>Matching Schemes:</span>
              <strong className="text-[#1b365d] font-bold text-sm">
                {filteredSchemes.length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white border border-slate-300 rounded-lg p-10 text-center space-y-3">
          <span className="text-3xl block">🔍</span>
          <h3 className="text-base font-bold text-slate-800">No schemes found matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your provider, state, or category filter to discover more government welfare schemes.
          </p>
          <button
            onClick={resetFilters}
            className="bg-[#1b365d] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#122440]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchemes.map((scheme) => (
            <SchemeEligibilityCard
              key={scheme.id}
              scheme={scheme}
              evaluation={scheme.evaluation}
              onUploadMissing={handleUploadMissing}
              language={language}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        initialDocId={targetDocId}
        onUploadSuccess={handleDocumentUploaded}
      />
    </div>
  );
}
