import { useState, useMemo } from 'react';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';
import DocumentUploadModal from './DocumentUploadModal.jsx';
import { FolderArchive, Search, CheckCircle2, AlertCircle, FileText, X, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-2xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-[#0f2942]" />
            <h3 className="text-base font-bold text-slate-900">Citizen Document Locker</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store and manage verification certificates to evaluate deterministic eligibility for 30 welfare schemes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold border border-slate-200">
            {uploadedCount} of {SUPPORTED_DOCUMENTS.length} Verified
          </span>
          <button
            onClick={() => openUploadFor('aadhaar')}
            className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white px-3.5 py-1.5 rounded text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
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
              setCurrentPage(1);
            }}
            placeholder="Search documents (Aadhaar, PAN, Land...)"
            className="w-full border border-slate-300 rounded pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#0f2942] bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 font-bold"
            >
              <X className="w-3.5 h-3.5" />
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
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#0f2942] text-white border-[#0f2942]'
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
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified ({uploadedCount})</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter('MISSING');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'MISSING'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Missing ({missingCount})</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="space-y-2.5">
        {paginatedDocuments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded text-slate-500 text-xs space-y-1">
            <Search className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No documents found matching "{searchQuery}"</p>
            <p className="text-[11px]">Try adjusting your search terms or clearing status filters.</p>
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
                  className={`border rounded-lg p-3.5 flex flex-col justify-between space-y-3 transition ${
                    isUploaded
                      ? 'bg-emerald-50/30 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        {docDef.category}
                      </span>
                      {isUploaded ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                          <span>Not Uploaded</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{docDef.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{docDef.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isUploaded ? (
                      <div className="text-[10px] text-slate-600 font-medium truncate max-w-[130px] flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{userDoc.fileName || 'Verified Document'}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Missing from locker</span>
                    )}

                    <button
                      type="button"
                      onClick={() => openUploadFor(docDef.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
                        isUploaded
                          ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-2xs'
                          : 'text-white bg-[#0f2942] hover:bg-[#1e3a5f] shadow-2xs'
                      }`}
                    >
                      {isUploaded ? 'Update File' : 'Upload'}
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
              className="px-2 py-1 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => handlePageChange(pg)}
                className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                  currentPage === pg
                    ? 'bg-[#0f2942] text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
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
