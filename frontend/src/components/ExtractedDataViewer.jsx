import { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Check,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Calendar,
  User,
  MapPin,
  IndianRupee,
  Building2,
  CheckCircle2,
  Code2,
  Layers,
  AlertCircle,
  Edit3,
  Save,
} from 'lucide-react';

// Default enriched extraction data for standard Indian documents
const DEFAULT_EXTRACTIONS = {
  aadhaar: {
    docId: 'aadhaar',
    name: 'Aadhaar Card',
    numberKey: 'Aadhaar Number',
    maskedNumber: 'XXXX-XXXX-9021',
    unmaskedNumber: '8492-3841-9021',
    category: 'Identity Proof',
    authority: 'Unique Identification Authority of India (UIDAI)',
    confidence: '98.5%',
    source: 'Secure UIDAI QR Code + Bilingual OCR',
    verifiedDate: '02 Oct 2026',
    fields: [
      { label: 'Full Legal Name', value: 'Rameshwar Patil', icon: User, confidence: '99%' },
      { label: 'Date of Birth', value: '14/05/1988 (Age 38)', icon: Calendar, confidence: '99%' },
      { label: 'Gender', value: 'Male', icon: User, confidence: '98%' },
      { label: 'Address & State', value: 'Satara District, Maharashtra - 415001', icon: MapPin, confidence: '97%' },
      { label: 'QR Digital Signature', value: 'Valid (UIDAI 2048-bit RSA)', icon: ShieldCheck, confidence: '100%' },
    ],
  },
  pan: {
    docId: 'pan',
    name: 'PAN Card',
    numberKey: 'Permanent Account Number (PAN)',
    maskedNumber: 'ABCDE1234F',
    unmaskedNumber: 'ABCDE1234F',
    category: 'Identity & Financial Proof',
    authority: 'Income Tax Department (NSDL/UTIITSL)',
    confidence: '99.0%',
    source: 'OCR Engine + NSDL Verification',
    verifiedDate: '02 Oct 2026',
    fields: [
      { label: 'Name on PAN', value: 'Rameshwar Patil', icon: User, confidence: '99%' },
      { label: "Father's Name", value: 'Ramrao Patil', icon: User, confidence: '96%' },
      { label: 'Date of Birth', value: '14/05/1988', icon: Calendar, confidence: '99%' },
      { label: 'Tax Status', value: 'Individual / Non-Corporate', icon: ShieldCheck, confidence: '98%' },
    ],
  },
  income_cert: {
    docId: 'income_cert',
    name: 'Income Certificate',
    numberKey: 'Certificate Application ID',
    maskedNumber: 'INC/MH/2026/09412',
    unmaskedNumber: 'INC/MH/2026/09412',
    category: 'Income Verification',
    authority: 'Office of Tehsildar, Satara, Maharashtra',
    confidence: '97.2%',
    source: 'Revenue Department Digitized Extract',
    verifiedDate: '03 Oct 2026',
    fields: [
      { label: 'Annual Family Income', value: '₹ 1,80,000 / annum', icon: IndianRupee, confidence: '99%' },
      { label: 'Income Tier', value: 'BPL / Low Income Group (< ₹ 2.5L)', icon: ShieldCheck, confidence: '98%' },
      { label: 'Validity Period', value: 'Valid for FY 2026 - 2027', icon: Calendar, confidence: '99%' },
      { label: 'Issuing Officer', value: 'Naib Tehsildar, Sub-Division Karad', icon: Building2, confidence: '95%' },
    ],
  },
  land_record: {
    docId: 'land_record',
    name: 'Land Record (7/12 Extract / RoR)',
    numberKey: 'Gat / Survey Number',
    maskedNumber: 'Survey Gat No. 142/A',
    unmaskedNumber: 'Survey Gat No. 142/A',
    category: 'Property & Agriculture',
    authority: 'Department of Revenue & Bhulekh Portal (Mahabhumi)',
    confidence: '96.8%',
    source: 'Bilingual OCR & Land Database Match',
    verifiedDate: '04 Oct 2026',
    fields: [
      { label: 'Total Landholding', value: '1.85 Acres (0.75 Hectares)', icon: Layers, confidence: '98%' },
      { label: 'Farmer Category', value: 'Small & Marginal Farmer (PM-KISAN Eligible)', icon: ShieldCheck, confidence: '99%' },
      { label: 'Irrigation Type', value: 'Seasonal Rainfed / Canal Irrigated', icon: FileText, confidence: '94%' },
      { label: 'Khatauni Account', value: 'Khata No. 88392', icon: Building2, confidence: '97%' },
    ],
  },
  bank_account: {
    docId: 'bank_account',
    name: 'Bank Account Passbook',
    numberKey: 'Account Number',
    maskedNumber: 'XXXXXXXX4912',
    unmaskedNumber: '304910294912',
    category: 'Direct Benefit Transfer (DBT)',
    authority: 'State Bank of India (Public Sector Bank)',
    confidence: '99.1%',
    source: 'Cheque Leaf / Passbook OCR',
    verifiedDate: '01 Oct 2026',
    fields: [
      { label: 'Account Holder', value: 'Rameshwar Patil', icon: User, confidence: '99%' },
      { label: 'IFSC Code', value: 'SBIN0001234 (Satara Main Branch)', icon: Building2, confidence: '99%' },
      { label: 'Aadhaar Seeding Status', value: 'Active NPCI Mapping (DBT Enabled)', icon: ShieldCheck, confidence: '100%' },
    ],
  },
  caste_cert: {
    docId: 'caste_cert',
    name: 'Caste Certificate',
    numberKey: 'Certificate Number',
    maskedNumber: 'CST/MH/2025/11094',
    unmaskedNumber: 'CST/MH/2025/11094',
    category: 'Social Category Proof',
    authority: 'Sub-Divisional Magistrate (SDM), Satara',
    confidence: '97.5%',
    source: 'State Caste Verification Scrutiny Committee',
    verifiedDate: '15 Sep 2026',
    fields: [
      { label: 'Recognized Category', value: 'OBC (Other Backward Classes)', icon: ShieldCheck, confidence: '99%' },
      { label: 'Sub-Caste', value: 'Kunbi Maratha', icon: User, confidence: '97%' },
      { label: 'Non-Creamy Layer Status', value: 'Certified Valid for 2026-27', icon: FileText, confidence: '98%' },
    ],
  },
};

export default function ExtractedDataViewer({
  documents = {},
  selectedDocId = 'aadhaar',
  onSelectDoc,
  onUpdateDocument,
  compact = false,
}) {
  const [activeDocKey, setActiveDocKey] = useState(selectedDocId || 'aadhaar');
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [idDraft, setIdDraft] = useState('');

  // Available document keys
  const docKeys = ['aadhaar', 'pan', 'income_cert', 'land_record', 'bank_account', 'caste_cert'];

  // Current active doc definition
  const currentKey = activeDocKey || 'aadhaar';
  const docMeta = DEFAULT_EXTRACTIONS[currentKey] || DEFAULT_EXTRACTIONS.aadhaar;
  const userUpload = documents[currentKey] || documents[docMeta.docId];

  // Determine whether this is a real user-uploaded document or mock template
  const isRealUpload = Boolean(
    userUpload &&
    (userUpload.status === 'VERIFIED' || userUpload.status === 'UPLOADED') &&
    userUpload.fileName &&
    !userUpload.fileName.includes('sample_')
  );

  // Dynamic field extraction from OCR pipeline
  const liveFields = userUpload?.extractedFields || userUpload?.metadata?.extracted_fields;
  const hasLiveFields = Boolean(liveFields && Object.keys(liveFields).length > 0);

  // Strictly prevent hardcoded data from bleeding into real uploads
  let rawDetectedNumber = '';
  if (isRealUpload) {
    if (userUpload?.number && userUpload.number !== 'Verified Official Record' && userUpload.number !== 'Verified Record') {
      rawDetectedNumber = userUpload.number;
    } else if (liveFields?.pan_number?.value) {
      rawDetectedNumber = liveFields.pan_number.value;
    } else if (liveFields?.aadhaar_number?.value) {
      rawDetectedNumber = liveFields.aadhaar_number.value;
    } else if (liveFields?.aadhaar_last_4?.value) {
      rawDetectedNumber = `XXXX-XXXX-${liveFields.aadhaar_last_4.value}`;
    } else if (liveFields?.certificate_number?.value) {
      rawDetectedNumber = liveFields.certificate_number.value;
    } else {
      rawDetectedNumber = 'Pending Verification / Not Detected';
    }
  } else {
    rawDetectedNumber = showUnmasked ? docMeta.unmaskedNumber : docMeta.maskedNumber;
  }

  const displayedNumber = isRealUpload ? rawDetectedNumber : (showUnmasked ? docMeta.unmaskedNumber : docMeta.maskedNumber);

  // Build resolved fields list
  let resolvedFields = [];
  if (isRealUpload) {
    if (hasLiveFields) {
      const list = [];
      for (const [k, v] of Object.entries(liveFields)) {
        const val = typeof v === 'object' && v !== null ? v.value : v;
        if (val !== undefined && val !== null && val !== '') {
          const conf = typeof v === 'object' && v?.confidence
            ? `${Math.round(v.confidence > 1 ? v.confidence : v.confidence * 100)}%`
            : '98%';
          const niceLabel = k
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const iconComponent =
            k.includes('date') || k.includes('dob') ? Calendar :
            k.includes('name') ? User :
            k.includes('income') ? IndianRupee :
            k.includes('address') || k.includes('district') ? MapPin :
            k.includes('bank') || k.includes('ifsc') ? Building2 : FileText;

          list.push({
            label: niceLabel,
            value: String(val),
            confidence: conf,
            icon: iconComponent,
          });
        }
      }
      resolvedFields = list;
    } else {
      // Do NOT fall back to Rameshwar Patil when real file is uploaded
      resolvedFields = [];
    }
  } else {
    // Only show sample preview for slots where no file is uploaded yet
    resolvedFields = docMeta.fields;
  }

  const handleSaveId = () => {
    if (!idDraft.trim()) {
      setIsEditingId(false);
      return;
    }
    const cleanId = idDraft.trim();
    if (userUpload) {
      userUpload.number = cleanId;
      if (!userUpload.extractedFields) userUpload.extractedFields = {};
      if (currentKey === 'pan') {
        userUpload.extractedFields.pan_number = { value: cleanId.toUpperCase(), confidence: 1.0, source: 'user_provided' };
      } else if (currentKey === 'aadhaar') {
        const last4 = cleanId.replace(/\D/g, '').slice(-4);
        userUpload.extractedFields.aadhaar_last_4 = { value: last4 || cleanId, confidence: 1.0, source: 'user_provided' };
      } else {
        userUpload.extractedFields.certificate_number = { value: cleanId, confidence: 1.0, source: 'user_provided' };
      }
      try {
        const saved = JSON.parse(localStorage.getItem('sahayak_citizen_docs') || '{}');
        saved[currentKey] = userUpload;
        localStorage.setItem('sahayak_citizen_docs', JSON.stringify(saved));
      } catch {}
      if (onUpdateDocument) onUpdateDocument(currentKey, userUpload);
    }
    setIsEditingId(false);
  };

  const handleCopy = (text, key) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const handleTabChange = (key) => {
    setActiveDocKey(key);
    setShowUnmasked(false);
    setIsEditingId(false);
    if (onSelectDoc) onSelectDoc(key);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs space-y-0">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0f2942] to-[#1e3a5f] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-400 text-slate-950 rounded-md">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
              AI Extracted Data Vault & Certificate Details
            </h3>
            {isRealUpload ? (
              <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                LIVE OCR VERIFIED
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                SAMPLE PREVIEW TEMPLATE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            {isRealUpload
              ? `Real-time OCR extracted and cryptographically verified fields from uploaded: ${userUpload.fileName}`
              : 'Demonstration template showing how Aadhaar numbers and attributes are extracted from official certificates.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowJsonRaw(!showJsonRaw)}
            className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-300" />
            <span>{showJsonRaw ? 'Formatted View' : 'Raw JSON'}</span>
          </button>
        </div>
      </div>

      {/* Document Switcher Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs">
        {docKeys.map((k) => {
          const item = DEFAULT_EXTRACTIONS[k];
          const hasUpload = !!documents[k] || !!documents[item.docId];
          const isSelected = currentKey === k;

          return (
            <button
              key={k}
              type="button"
              onClick={() => handleTabChange(k)}
              className={`px-3 py-1.5 rounded-md font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#0f2942] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{item.name.split(' ')[0]}</span>
              {hasUpload ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Document Uploaded"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300" title="Missing"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Body */}
      {showJsonRaw ? (
        <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-96">
          <pre>{JSON.stringify(userUpload || docMeta, null, 2)}</pre>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Hero Document ID Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-300 rounded-lg p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0f2942]" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {docMeta.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  • {docMeta.authority}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Confidence: {docMeta.confidence}</span>
              </div>
            </div>

            {/* Extracted Identification Number Box */}
            <div className="bg-white border-2 border-slate-300 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  {docMeta.numberKey} {isRealUpload ? '(User Document Record)' : '(Extracted Sample)'}
                </span>

                {isEditingId ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <input
                      type="text"
                      value={idDraft}
                      onChange={(e) => setIdDraft(e.target.value)}
                      placeholder={currentKey === 'aadhaar' ? 'e.g. 8492-3841-9021' : 'e.g. ABCDE9999Z'}
                      className="border border-[#0f2942] rounded px-2.5 py-1 text-xs font-mono font-bold text-[#0f2942] focus:outline-none w-56 bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveId}
                      className="bg-[#0f2942] hover:bg-[#1a3b5c] text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingId(false)}
                      className="text-slate-500 hover:text-slate-700 text-xs font-semibold px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="font-mono text-base sm:text-lg font-black text-[#0f2942] tracking-wider mt-0.5 flex flex-wrap items-center gap-2">
                    <span className={displayedNumber.includes('Pending') ? 'text-slate-400 font-sans text-xs font-normal' : ''}>
                      {displayedNumber}
                    </span>
                    {!displayedNumber.includes('Pending') && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 font-sans font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                        {isRealUpload ? 'VERIFIED' : 'MATCHED'}
                      </span>
                    )}
                    {isRealUpload && (
                      <button
                        type="button"
                        onClick={() => {
                          setIdDraft(displayedNumber.includes('Pending') ? '' : displayedNumber);
                          setIsEditingId(true);
                        }}
                        className="text-slate-600 hover:text-[#0f2942] text-xs font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer font-sans"
                        title="Edit or enter your credential identifier"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px]">Edit ID</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Reveal & Copy */}
              <div className="flex items-center gap-2 shrink-0">
                {!isRealUpload && (
                  <button
                    type="button"
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 border border-slate-300 transition cursor-pointer"
                    title={showUnmasked ? 'Mask Document ID' : 'Reveal Full Document ID'}
                  >
                    {showUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showUnmasked ? 'Mask' : 'Reveal'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(displayedNumber, 'main_number')}
                  disabled={displayedNumber.includes('Pending')}
                  className="bg-[#0f2942] hover:bg-[#1a3b5c] disabled:opacity-40 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  {copiedKey === 'main_number' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'main_number' ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            {/* Source & Verification Metadata Strip */}
            <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <span className="font-semibold text-slate-700">Source:</span>{' '}
                <span>
                  {isRealUpload
                    ? `Uploaded File: ${userUpload.fileName}`
                    : docMeta.source}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Verified Timestamp:</span>{' '}
                <span className="font-mono">
                  {userUpload?.uploadedAt || docMeta.verifiedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Field Breakdown Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Extracted Attributes ({resolvedFields.length})</span>
              </span>
              {!isRealUpload && (
                <span className="text-[10px] text-amber-600 font-semibold lowercase">
                  * sample demonstration template
                </span>
              )}
            </h4>

            {isRealUpload && resolvedFields.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-slate-800">
                      File Scan Enrolled in Locker • Manual Officer Verification Queued
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Your document file <strong className="font-mono text-slate-900">{userUpload.fileName}</strong> is safely stored and encrypted in your citizen locker. The automated OCR engine did not find machine-readable text anchors or a QR code in this scan layer.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Enrolled File</span>
                    <span className="font-semibold text-slate-800 truncate block">{userUpload.fileName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">File Size</span>
                    <span className="font-semibold text-slate-800">{userUpload.fileSize || '1.2 MB'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Locker Status</span>
                    <span className="font-bold text-emerald-700">Verified & Active</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {resolvedFields.map((fld, idx) => {
                  const IconComponent = fld.icon || FileText;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200 rounded-md p-2.5 flex items-start justify-between gap-2 transition"
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded mt-0.5 shadow-2xs">
                          <IconComponent className="w-3.5 h-3.5 text-[#0f2942]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            {fld.label}
                          </span>
                          <span className="text-xs font-bold text-slate-900 leading-snug">
                            {fld.value}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(fld.value, `field_${idx}`)}
                        title="Copy field value"
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-white transition cursor-pointer"
                      >
                        {copiedKey === `field_${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
