import { useState } from 'react';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';

export default function DocumentUploadModal({
  isOpen,
  onClose,
  initialDocId = 'aadhaar',
  onUploadSuccess,
}) {
  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentDocDef =
    SUPPORTED_DOCUMENTS.find((d) => d.id === selectedDocId) || SUPPORTED_DOCUMENTS[0];

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    // Simulate real network upload and instant document verification
    setTimeout(() => {
      const docPayload = {
        status: 'VERIFIED',
        uploadedAt: new Date().toISOString().split('T')[0],
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
        number: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      setUploading(false);
      onUploadSuccess(selectedDocId, docPayload);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📤</span>
            <h3 className="font-bold text-base text-[#1b365d]">Upload Verification Document</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Document Type</label>
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setError('');
              }}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#1b365d] bg-white font-medium"
            >
              {SUPPORTED_DOCUMENTS.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.icon} {doc.name} ({doc.category})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded space-y-1">
            <p className="font-semibold text-slate-800">{currentDocDef.name}</p>
            <p className="text-[11px] text-slate-600">{currentDocDef.description}</p>
            <p className="text-[10px] text-slate-500 font-mono">Accepted: {currentDocDef.acceptedFormats}</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2 rounded text-[11px] font-semibold">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Choose File from Device</label>
            <div className="border-2 border-dashed border-slate-300 hover:border-[#1b365d] rounded-lg p-4 text-center cursor-pointer transition bg-slate-50">
              <input
                type="file"
                id="doc-file-input"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer space-y-1 block">
                <span className="text-2xl block">📁</span>
                <span className="font-bold text-[#1b365d] block">
                  {selectedFile ? selectedFile.name : 'Click to browse or drop file'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(0)} KB • Ready to upload`
                    : 'PDF, JPG, or PNG up to 10MB'}
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-1.5 bg-[#1b365d] hover:bg-[#122440] text-white rounded font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {uploading && <span className="animate-spin">⏳</span>}
              <span>{uploading ? 'Verifying & Saving...' : 'Upload & Verify'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
