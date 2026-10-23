import { useState, useMemo } from 'react';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';
import DocumentUploadModal from './DocumentUploadModal.jsx';
import ExtractedDataViewer from './ExtractedDataViewer.jsx';
import {
  FolderArchive,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';

export default function DocumentManager({
  documents = {},
  onDocumentUploaded,
  language = 'en',
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState('aadhaar');
  const [inspectDocId, setInspectDocId] = useState(null);

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

  const openInspectFor = (docId) => {
    setInspectDocId(docId);
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
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold border border-slate-200 hidden sm:inline">
            {uploadedCount} of {SUPPORTED_DOCUMENTS.length} Verified
          </span>
          <button
            type="button"
            onClick={() => openInspectFor('aadhaar')}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1.5 rounded text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="View AI Extracted Data like Aadhaar Number, PAN, etc."
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Extracted Data Vault</span>
          </button>
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

                    {/* Extracted Credential Quick Strip */}
                    {isUploaded && (
                      <div className="bg-white/90 border border-emerald-300 rounded p-2 text-xs flex items-center justify-between gap-2 shadow-2xs mt-1">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                            Extracted Credential ID
                          </span>
                          <span className="font-mono font-bold text-xs text-[#0f2942]">
                            {userDoc.number || (docDef.id === 'aadhaar' ? 'XXXX-XXXX-9021' : 'Verified & Stored')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openInspectFor(docDef.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-1 rounded border border-emerald-300 transition cursor-pointer shrink-0"
                          title="View OCR & Extracted Data"
                        >
                          <Eye className="w-3 h-3 text-emerald-700" />
                          <span>View Data</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isUploaded ? (
                      <div className="text-[10px] text-slate-600 font-medium truncate max-w-[120px] flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{userDoc.fileName || 'Verified Document'}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Missing from locker</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {isUploaded && (
                        <button
                          type="button"
                          onClick={() => openInspectFor(docDef.id)}
                          className="text-[11px] font-semibold px-2 py-1 rounded text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer flex items-center gap-1"
                          title="Inspect AI Extracted Attributes"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>Inspect</span>
                        </button>
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
                        {isUploaded ? 'Update' : 'Upload'}
                      </button>
                    </div>
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

      {/* Extracted Data Inspection Modal */}
      {inspectDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setInspectDocId(null)}
              className="absolute top-3.5 right-3.5 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <ExtractedDataViewer
              documents={documents}
              selectedDocId={inspectDocId}
              onSelectDoc={(id) => setInspectDocId(id)}
              onUpdateDocument={onDocumentUploaded}
            />
          </div>
        </div>
      )}
    </div>
  );
}
