// -----------------------------------------------------------------------------
// Standard Document Types for SAHAYAK
// Defines the document metadata, accepted formats, and sample placeholders.
// Provides 100% parity with backend/DB canonical 27 documents.
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
  },
  {
    id: 'pan',
    name: 'PAN Card',
    hiName: 'पैन कार्ड',
    category: 'Identity & Financial Proof',
    acceptedFormats: 'PDF, JPG, PNG (Max 5MB)',
    description: 'Permanent Account Number issued by Income Tax Department.',
    sampleNumberFormat: 'ABCDE1234F',
  },
  {
    id: 'photo',
    name: 'Passport Size Photograph',
    hiName: 'पासपोर्ट साइज फोटो',
    category: 'Biometric Verification',
    acceptedFormats: 'JPG, PNG (Max 2MB)',
    description: 'Recent color photograph with white or light background.',
    sampleNumberFormat: 'Recent 3.5cm x 4.5cm',
  },
  {
    id: 'income_cert',
    name: 'Income Certificate',
    hiName: 'आय प्रमाण पत्र',
    category: 'Income Verification',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Issued by Tehsildar or Revenue Authority declaring annual family income.',
    sampleNumberFormat: 'Valid for current financial year',
  },
  {
    id: 'caste_cert',
    name: 'Caste Certificate',
    hiName: 'जाति प्रमाण पत्र',
    category: 'Social Category Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Official certificate for SC, ST, OBC, or EWS categories.',
    sampleNumberFormat: 'Issued by Competent Authority',
  },
  {
    id: 'land_record',
    name: 'Land Ownership Document (RoR / 7-12 Extract)',
    hiName: 'भू-अभिलेख / खसरा-खतौनी / 7/12 उतारा',
    category: 'Property & Agriculture',
    acceptedFormats: 'PDF (Max 10MB)',
    description: 'Proof of cultivable landholding, 7/12 extract, or Jamabandi/Khatauni record.',
    sampleNumberFormat: 'Survey / Khasra Number record',
  },
  {
    id: 'ration_card',
    name: 'Ration Card (BPL / Antyodaya / NFSA)',
    hiName: 'राशन कार्ड (BPL / अंत्योदय / NFSA)',
    category: 'Socio-Economic Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Food & Civil Supplies card certifying Below Poverty Line or Antyodaya status.',
    sampleNumberFormat: 'State Ration Card No.',
  },
  {
    id: 'bank_passbook',
    name: 'Bank Account Passbook / Cancelled Cheque',
    hiName: 'बैंक पासबुक / खाता विवरण',
    category: 'DBT Financial Details',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Active bank account linked with Aadhaar for Direct Benefit Transfer (DBT).',
    sampleNumberFormat: 'Account No. & IFSC Code',
  },
  {
    id: 'domicile',
    name: 'Domicile / Residence Certificate',
    hiName: 'मूल निवास प्रमाण पत्र',
    category: 'Residential Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Proof of permanent residence in the respective state or union territory.',
    sampleNumberFormat: 'Issued by District Magistrate/Tehsildar',
  },
  {
    id: 'mobile_number',
    name: 'Aadhaar-Linked Mobile Number',
    hiName: 'आधार लिंक मोबाइल नंबर',
    category: 'Authentication',
    acceptedFormats: 'SMS OTP Verification',
    description: 'Active mobile number linked with Aadhaar and bank account for DBT alerts.',
    sampleNumberFormat: '+91 98XXX XXXXX',
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate (Girl Child / Newborn)',
    hiName: 'जन्म प्रमाण पत्र',
    category: 'Identity Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Official birth certificate issued by Municipal Corporation or Registrar of Births.',
    sampleNumberFormat: 'Registration No. / Municipal Record',
  },
  {
    id: 'mgnrega_job_card',
    name: 'MGNREGA Job Card',
    hiName: 'मनरेगा जॉब कार्ड',
    category: 'Employment Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Issued by Gram Panchayat certifying rural household employment registration.',
    sampleNumberFormat: 'Panchayat Job Card Number',
  },
  {
    id: 'udyam_registration',
    name: 'Business Registration / Udyam Certificate',
    hiName: 'उद्यम पंजीकरण प्रमाण पत्र',
    category: 'Business & Enterprise',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Ministry of MSME official Udyam Registration Certificate for micro/small enterprise.',
    sampleNumberFormat: 'UDYAM-XX-00-0000000',
  },
  {
    id: 'vending_certificate',
    name: 'Street Vending Certificate / ID / LoR',
    hiName: 'पथ विक्रेता प्रमाण पत्र / वेंडिंग आईडी',
    category: 'Occupation Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Vending Certificate or Letter of Recommendation (LoR) issued by Urban Local Body.',
    sampleNumberFormat: 'ULB Vending Identity No.',
  },
  {
    id: 'mcp_card',
    name: 'Mother-Child Protection Card (MCP Card)',
    hiName: 'मातृ एवं बाल सुरक्षा कार्ड',
    category: 'Healthcare & Maternal',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Official MCP Card issued by Ministry of Health & Family Welfare for maternal benefits.',
    sampleNumberFormat: 'RCH / Anganwadi Record ID',
  },
  {
    id: 'age_proof',
    name: 'Age Proof Document',
    hiName: 'आयु प्रमाण पत्र',
    category: 'Identity Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'School Leaving Certificate, Matriculation Marksheet, or Age Certificate.',
    sampleNumberFormat: 'Official Issuing Authority ID',
  },
  {
    id: 'electricity_bill_id',
    name: 'Electricity Bill / Consumer ID',
    hiName: 'बिजली बिल / उपभोक्ता आईडी',
    category: 'Utility & Residence',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Recent electricity utility bill showing consumer account ID and residential address.',
    sampleNumberFormat: 'DISCOM Consumer ID',
  },
  {
    id: 'educational_certificate',
    name: 'Educational Qualification Certificate',
    hiName: 'शैक्षणिक योग्यता प्रमाण पत्र',
    category: 'Education Proof',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Degree, Diploma, or 10th/12th passing marksheets issued by recognized board/university.',
    sampleNumberFormat: 'Roll / Registration Number',
  },
  {
    id: 'disability_certificate',
    name: 'Disability Certificate (UDID)',
    hiName: 'दिव्यांगता प्रमाण पत्र / UDID',
    category: 'Special Category',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Unique Disability ID (UDID) or certificate issued by Medical Board certifying 40%+ disability.',
    sampleNumberFormat: 'UDID Card No.',
  },
  {
    id: 'address_proof',
    name: 'Address Proof / Domicile Record',
    hiName: 'पते का प्रमाण',
    category: 'Residential Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Utility bill, voter card, or official certificate establishing permanent address.',
    sampleNumberFormat: 'Document Reference Number',
  },
  {
    id: 'project_report',
    name: 'Business Project / Activity Report',
    hiName: 'परियोजना रिपोर्ट',
    category: 'Business & Enterprise',
    acceptedFormats: 'PDF (Max 10MB)',
    description: 'Detailed project estimate / proposal for self-employment or micro-enterprise.',
    sampleNumberFormat: 'DPR Proposal Reference',
  },
  {
    id: 'cap_allotment_letter',
    name: 'CAP Admission / Allotment Letter',
    hiName: 'सीएपी आवंटन पत्र',
    category: 'Education Proof',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Centralised Admission Process (CAP) allotment letter for higher education courses.',
    sampleNumberFormat: 'CAP Application ID',
  },
  {
    id: 'class_12_marksheet',
    name: 'Class 12th Board Marksheet',
    hiName: '12वीं कक्षा अंकतालिका',
    category: 'Education Proof',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Higher Secondary School Certificate (HSC) or 10+2 marksheet from recognized board.',
    sampleNumberFormat: 'Board Roll Number',
  },
  {
    id: 'degree_or_diploma_certificate',
    name: 'Degree or Diploma Certificate',
    hiName: 'डिग्री / डिप्लोमा प्रमाण पत्र',
    category: 'Education Proof',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Passing certificate or marksheet for University Degree or Polytechnic Diploma.',
    sampleNumberFormat: 'Convocation / Degree Number',
  },
  {
    id: 'death_or_disability_certificate',
    name: 'Death / Disability Certificate',
    hiName: 'मृत्यु / स्थायी दिव्यांगता प्रमाण पत्र',
    category: 'Special Category',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: 'Official Death Certificate or Medical Board Permanent Disability report.',
    sampleNumberFormat: 'Hospital / Civil Registrar ID',
  },
  {
    id: 'post_mortem_report',
    name: 'Post Mortem / FIR Police Report',
    hiName: 'पोस्टमार्टम / पुलिस रिपोर्ट',
    category: 'Legal & Police Records',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Certified copy of Police FIR, Panchnama, or Hospital Post-Mortem examination.',
    sampleNumberFormat: 'Police Station FIR No.',
  },
  {
    id: 'rental_agreement',
    name: 'Rent Agreement / Lease Deed',
    hiName: 'किरायानामा',
    category: 'Residential Proof',
    acceptedFormats: 'PDF (Max 5MB)',
    description: 'Registered lease deed or notarized tenancy contract proving residential status.',
    sampleNumberFormat: 'Agreement Document Number',
  },
];

// Bidirectional aliases mapping between MongoDB seed data and frontend keys
export const DOCUMENT_KEY_ALIASES = {
  // DB key -> Frontend key
  bank_account: 'bank_passbook',
  income_certificate: 'income_cert',
  caste_certificate: 'caste_cert',
  domicile_certificate: 'domicile',
  photograph: 'photo',
  land_records: 'land_record',

  // Frontend key -> DB key
  bank_passbook: 'bank_account',
  income_cert: 'income_certificate',
  caste_cert: 'caste_certificate',
  domicile: 'domicile_certificate',
  photo: 'photograph',
  land_record: 'land_record',
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
    const aliasMatch = SUPPORTED_DOCUMENTS.find((d) => d.id === alias);
    if (aliasMatch) return aliasMatch;
  }
  return {
    id: clean,
    name: clean.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    hiName: clean,
    category: 'General Verification',
    acceptedFormats: 'PDF, JPG (Max 5MB)',
    description: `Official ${clean.replace(/_/g, ' ')} document.`,
    sampleNumberFormat: 'Government Record ID',
  };
}

// Initial mock document state for newly registered citizen demo
export const INITIAL_CITIZEN_DOCUMENTS = {};
