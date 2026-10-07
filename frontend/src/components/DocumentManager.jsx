import { useState, useMemo } from 'react';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';
import DocumentUploadModal from './DocumentUploadModal.jsx';

export default function DocumentManager({
  documents = {},
  onDocumentUploaded,
  language = 'en',
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState('aadhaar');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'MISSING'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const openUploadFor = (docId) => {
    setSelectedDocForUpload(docId);
    setModalOpen(true);
  };

  const uploadedCount = Object.values(documents).filter(
    (d) => d && (d.status === 'VERIFIED' || d.status === 'UPLOADED')
  ).length;

  const missingCount = SUPPORTED_DOCUMENTS.length - uploadedCount;

  // Filter & Search Documents
  const filteredDocuments = useMemo(() => {
    return SUPPORTED_DOCUMENTS.filter((docDef) => {
      const userDoc = documents[docDef.id];
      const isUploaded =
        userDoc && (userDoc.status === 'VERIFIED' || userDoc.status === 'UPLOADED');

      // Status filter
      if (statusFilter === 'VERIFIED' && !isUploaded) return false;
      if (statusFilter === 'MISSING' && isUploaded) return false;

      // Search query
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      return (
        docDef.name.toLowerCase().includes(q) ||
        docDef.category.toLowerCase().includes(q) ||
        docDef.description.toLowerCase().includes(q) ||
        docDef.id.toLowerCase().includes(q)
      );
    });
  }, [documents, searchQuery, statusFilter]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 shadow-2xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗂️</span>
            <h3 className="text-base font-bold text-[#1b365d]">My Citizen Document Locker</h3>
          </div>
          <p className="text-xs text-slate-500">
            Upload and verify your certificates to unlock eligible Central and State welfare programs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold border border-slate-200">
            {uploadedCount} / {SUPPORTED_DOCUMENTS.length} Verified
          </span>
          <button
            onClick={() => openUploadFor('aadhaar')}
            className="bg-[#1b365d] hover:bg-[#122440] text-white px-3.5 py-1.5 rounded text-xs font-bold transition shadow-xs flex items-center gap-1"
          >
            <span>+</span>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-slate-50 p-2.5 rounded-md border border-slate-200">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            placeholder="Search documents (Aadhaar, PAN, Land, Income...)"
            className="w-full border border-slate-300 rounded pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#1b365d] bg-white"
          />
          <span className="absolute left-2 top-1.5 text-slate-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              statusFilter === 'ALL'
                ? 'bg-[#1b365d] text-white border-[#1b365d]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            All ({SUPPORTED_DOCUMENTS.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('VERIFIED');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            ✓ Verified ({uploadedCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter('MISSING');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
              statusFilter === 'MISSING'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-50'
            }`}
          >
            ✕ Missing ({missingCount})
          </button>
        </div>
      </div>

      {/* Scrollable Container with Custom Scrollbar */}
      <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {paginatedDocuments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs space-y-1">
            <span className="text-2xl block">🔍</span>
            <p className="font-bold text-slate-700">No documents found matching "{searchQuery}"</p>
            <p className="text-[11px]">Try clearing your search query or switching filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedDocuments.map((docDef) => {
              const userDoc = documents[docDef.id];
              const isUploaded =
                userDoc && (userDoc.status === 'VERIFIED' || userDoc.status === 'UPLOADED');

              return (
                <div
                  key={docDef.id}
                  className={`border rounded p-3 flex flex-col justify-between space-y-2.5 transition ${
                    isUploaded
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg" aria-hidden="true">
                        {docDef.icon}
                      </span>
                      {isUploaded ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                          <span>✓</span>
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">
                          <span>✕</span>
                          <span>Not Uploaded</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{docDef.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{docDef.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {isUploaded ? (
                      <div className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                        📄 {userDoc.fileName || 'Verified Document'}
                      </div>
                    ) : (
                      <span className="text-[10px] text-rose-600 font-medium">Missing</span>
                    )}

                    <button
                      type="button"
                      onClick={() => openUploadFor(docDef.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded transition ${
                        isUploaded
                          ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-2xs'
                          : 'text-white bg-[#1b365d] hover:bg-[#122440] shadow-2xs'
                      }`}
                    >
                      {isUploaded ? 'Replace' : '+ Upload'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
          <span className="text-[11px] text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} Documents
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => handlePageChange(pg)}
                className={`w-7 h-7 rounded text-xs font-bold transition ${
                  currentPage === pg
                    ? 'bg-[#1b365d] text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDocId={selectedDocForUpload}
        onUploadSuccess={(docId, payload) => {
          onDocumentUploaded(docId, payload);
        }}
      />
    </div>
  );
}
