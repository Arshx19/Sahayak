// -----------------------------------------------------------------------------
// Standard Document Types for SAHAYAK
// Defines the document metadata, accepted formats, and sample placeholders.
// Ready to be expanded dynamically when the Excel sheet is imported.
// -----------------------------------------------------------------------------

export const SUPPORTED_DOCUMENTS = [
  {
    id: 'aadhaar',
    name: 'Aadhaar Card',
    hiName: 'आधार कार्ड',
    category: 'Identity Proof',
    acceptedFormats: 'PDF, JPG, PNG (Max 5MB)',
    description: 'Unique 12-digit biometric identity issued by UIDAI.',
    sampleNumberFormat: 'XXXX-XXXX-1234',
    icon: '🪪',
  },
  {
    id: 'pan',
    name: 'PAN Card',
    hiName: 'पैन कार्ड',
    category: 'Identity & Financial Proof',
    acceptedFormats: 'PDF, JPG, PNG (Max 5MB)',
    description: 'Permanent Account Number issued by Income Tax Department.',
    sampleNumberFormat: 'ABCDE1234F',
    icon: '💳',
  },
  {
    id: 'photo',
    name: 'Photo Verification (Passport Size)',
    hiName: 'पासपोर्ट साइज फोटो',
    category: 'Biometric Verification',
    acceptedFormats: 'JPG, PNG (Max 2MB)',
    description: 'Recent color photograph with white or light background.',
    sampleNumberFormat: 'Recent 3.5cm x 4.5cm',
    icon: '📷',
  },
  {
    id: 'income_cert',
    name: 'Income Certificate',
    hiName: 'आय प्रमाण पत्र',
    category: 'Income Verification',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Issued by Tehsildar or Revenue Authority declaring annual family income.',
    sampleNumberFormat: 'Valid for current financial year',
    icon: '📜',
  },
  {
    id: 'caste_cert',
    name: 'Caste Certificate',
    hiName: 'जाति प्रमाण पत्र',
    category: 'Social Category Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Official certificate for SC, ST, OBC, or EWS categories.',
    sampleNumberFormat: 'Issued by Competent Authority',
    icon: '📋',
  },
  {
    id: 'land_record',
    name: 'Land Records / Khasra-Khatauni',
    hiName: 'भू-अभिलेख / खसरा-खतौनी',
    category: 'Property & Agriculture',
    acceptedFormats: 'PDF (Max 10MB)',
    description: 'Proof of cultivable landholding, 7/12 extract, or Jamabandi record.',
    sampleNumberFormat: 'Survey / Khasra Number record',
    icon: '🌾',
  },
  {
    id: 'ration_card',
    name: 'Ration Card (BPL / AAY)',
    hiName: 'राशन कार्ड (BPL / अंत्योदय)',
    category: 'Socio-Economic Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Food & Civil Supplies card certifying Below Poverty Line or Antyodaya status.',
    sampleNumberFormat: 'State Ration Card No.',
    icon: '🍚',
  },
  {
    id: 'bank_passbook',
    name: 'Bank Passbook / Cancelled Cheque',
    hiName: 'बैंक पासबुक / खाता विवरण',
    category: 'DBT Financial Details',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Active bank account linked with Aadhaar for Direct Benefit Transfer (DBT).',
    sampleNumberFormat: 'Account No. & IFSC Code',
    icon: '🏦',
  },
  {
    id: 'domicile',
    name: 'Domicile / Residence Certificate',
    hiName: 'मूल निवास प्रमाण पत्र',
    category: 'Residential Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Proof of permanent residence in the respective state or union territory.',
    sampleNumberFormat: 'Issued by District Magistrate/Tehsildar',
    icon: '🏠',
  },
  {
    id: 'mobile_number',
    name: 'Aadhaar-Linked Mobile Number',
    hiName: 'आधार लिंक मोबाइल नंबर',
    category: 'Authentication',
    acceptedFormats: 'SMS OTP Verification',
    description: 'Active mobile number linked with Aadhaar and bank account for DBT alerts.',
    sampleNumberFormat: '+91 98XXX XXXXX',
    icon: '📱',
  },
  {
    id: 'age_proof',
    name: 'Age Proof / Birth Certificate',
    hiName: 'आयु प्रमाण पत्र',
    category: 'Identity Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Birth Certificate, School Leaving Certificate, or Matriculation Marksheet.',
    sampleNumberFormat: 'Official Issuing Authority',
    icon: '📅',
  },
  {
    id: 'electricity_bill_id',
    name: 'Electricity Bill / Account ID',
    hiName: 'बिजली बिल / उपभोक्ता आईडी',
    category: 'Utility & Residence',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Recent electricity utility bill showing consumer account ID and residential address.',
    sampleNumberFormat: 'DISCOM Consumer ID',
    icon: '⚡',
  },
  {
    id: 'educational_certificate',
    name: 'Educational Qualification Certificate',
    hiName: 'शैक्षणिक योग्यता प्रमाण पत्र',
    category: 'Education Proof',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Degree, Diploma, or 10th/12th passing marksheets issued by recognized board/university.',
    sampleNumberFormat: 'Roll / Registration Number',
    icon: '🎓',
  },
  {
    id: 'disability_certificate',
    name: 'Disability Certificate (UDID)',
    hiName: 'दिव्यांगता प्रमाण पत्र / UDID',
    category: 'Special Category',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Unique Disability ID (UDID) or certificate issued by Medical Board certifying 40%+ disability.',
    sampleNumberFormat: 'UDID Card No.',
    icon: '♿',
  },
];

// Bidirectional aliases mapping between MongoDB seed data and frontend keys
export const DOCUMENT_KEY_ALIASES = {
  // DB key -> Frontend key
  bank_account: 'bank_passbook',
  income_certificate: 'income_cert',
  caste_certificate: 'caste_cert',
  domicile_certificate: 'domicile',
  // Frontend key -> DB key
  bank_passbook: 'bank_account',
  income_cert: 'income_certificate',
  caste_cert: 'caste_certificate',
  domicile: 'domicile_certificate',
};

/**
 * Returns the resolved document definition by ID or canonical DB alias
 */
export function getDocumentDefinition(docKey) {
  if (!docKey) return null;
  const clean = docKey.toLowerCase().trim();
  const direct = SUPPORTED_DOCUMENTS.find((d) => d.id === clean);
  if (direct) return direct;
  const alias = DOCUMENT_KEY_ALIASES[clean];
  if (alias) {
    return SUPPORTED_DOCUMENTS.find((d) => d.id === alias) || null;
  }
  return {
    id: clean,
    name: clean.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    hiName: clean,
    category: 'General Verification',
    icon: '📄',
  };
}

// Initial mock document state for newly registered citizen demo
export const INITIAL_CITIZEN_DOCUMENTS = {
  aadhaar: {
    status: 'VERIFIED',
    uploadedAt: '2026-09-15',
    fileName: 'aadhaar_rameshwar_patil.pdf',
    fileSize: '1.4 MB',
    number: 'XXXX-XXXX-8921',
  },
  bank_passbook: {
    status: 'VERIFIED',
    uploadedAt: '2026-09-18',
    fileName: 'sbi_passbook_verified.pdf',
    fileSize: '950 KB',
    number: 'State Bank of India (IFSC: SBIN0001234)',
  },
  photo: {
    status: 'VERIFIED',
    uploadedAt: '2026-09-20',
    fileName: 'rameshwar_photo.jpg',
    fileSize: '420 KB',
    number: 'Photo ID Verified',
  },
  mobile_number: {
    status: 'VERIFIED',
    uploadedAt: '2026-09-20',
    fileName: 'Aadhaar-OTP Verified',
    fileSize: 'N/A',
    number: '+91 98765 43210',
  },
  pan: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  land_record: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  income_cert: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  caste_cert: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  ration_card: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  domicile: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  age_proof: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  electricity_bill_id: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  educational_certificate: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
  disability_certificate: {
    status: 'NOT_UPLOADED',
    uploadedAt: null,
    fileName: null,
    fileSize: null,
    number: null,
  },
};
