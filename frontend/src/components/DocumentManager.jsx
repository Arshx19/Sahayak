import { useState } from 'react';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';
import DocumentUploadModal from './DocumentUploadModal.jsx';

export default function DocumentManager({
  documents = {},
  onDocumentUploaded,
  language = 'en',
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState('aadhaar');

  const openUploadFor = (docId) => {
    setSelectedDocForUpload(docId);
    setModalOpen(true);
  };

  const uploadedCount = Object.values(documents).filter(
    (d) => d && (d.status === 'VERIFIED' || d.status === 'UPLOADED')
  ).length;

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗂️</span>
            <h3 className="text-base font-bold text-[#1b365d]">My Citizen Document Locker</h3>
          </div>
          <p className="text-xs text-slate-500">
            Upload your verification documents to automatically unlock matching Central and State schemes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold border border-slate-200">
            {uploadedCount} / {SUPPORTED_DOCUMENTS.length} Uploaded
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

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUPPORTED_DOCUMENTS.map((docDef) => {
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
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                    📄 {userDoc.fileName || 'Document on file'}
                  </div>
                ) : (
                  <span className="text-[10px] text-rose-600 font-medium">Missing</span>
                )}

                <button
                  type="button"
                  onClick={() => openUploadFor(docDef.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded transition ${
                    isUploaded
                      ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-100'
                      : 'text-white bg-[#1b365d] hover:bg-[#122440]'
                  }`}
                >
                  {isUploaded ? 'Replace' : '+ Upload'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
