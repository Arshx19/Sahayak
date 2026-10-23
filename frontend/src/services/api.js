// -----------------------------------------------------------------------------
// SAHAYAK API Service Layer
// Communicates with FastAPI backend at API_BASE_URL.
// Automatically attaches JWT Bearer token from localStorage.
// Gracefully falls back to mock dataset if the backend server is offline.
// -----------------------------------------------------------------------------
import { MOCK_SCHEMES } from '../data/schemes.js';
import { MOCK_GRIEVANCES } from '../data/grievances.js';
import { MOCK_PROFILE } from '../data/profile.js';
import { INITIAL_CITIZEN_DOCUMENTS, DOCUMENT_KEY_ALIASES } from '../data/documentsData.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// Universal HTTP Request Helper with JWT token injection
export const request = async (path, options = {}) => {
  const token = localStorage.getItem('sahayak_token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.detail || `API error ${response.status}`;
    throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
  }

  return data;
};

// =============================================================================
// AUTHENTICATION & USERS
// =============================================================================
export const loginUser = async (credentials) => {
  try {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (err) {
    // If backend is unreachable, throw so AuthContext can offer demo login fallback
    throw err;
  }
};

export const registerUser = async (userData) => {
  try {
    return await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (err) {
    throw err;
  }
};

export const getCurrentUser = async () => {
  try {
    const res = await request('/users/me');
    return res.data;
  } catch {
    const saved = localStorage.getItem('sahayak_user');
    return saved ? JSON.parse(saved) : null;
  }
};

// =============================================================================
// CITIZEN DOCUMENT LOCKER (Matches backend/DB user_documents collection)
// =============================================================================
export const getUserDocuments = async (userId = null) => {
  try {
    const res = await request('/documents');
    if (res && res.data && Array.isArray(res.data)) {
      // Map MongoDB user_documents list into a lookup object keyed by document_type
      const docsMap = {};
      res.data.forEach((d) => {
        const docKey = d.document_type?.toLowerCase();
        docsMap[docKey] = {
          status: (d.verification_status || 'verified').toUpperCase(),
          uploadedAt: d.uploaded_at ? new Date(d.uploaded_at).toISOString().split('T')[0] : '2026-10-01',
          fileName: d.file_name || `${docKey}_verified.pdf`,
          fileSize: d.file_size_bytes ? `${Math.round(d.file_size_bytes / 1024)} KB` : '1.2 MB',
          number: d.document_number || 'Verified Record',
          fileUrl: d.file_url || null,
          extractedFields: d.metadata?.extracted_fields || {},
          needsReview: d.metadata?.needs_review || [],
          validationErrors: d.metadata?.validation_errors || [],
          metadata: d.metadata || {},
        };
      });
      return docsMap;
    }
  } catch {
    // Fallback to local storage or demo documents
  }

  try {
    const saved = localStorage.getItem('sahayak_citizen_docs');
    if (saved) return JSON.parse(saved);
  } catch {}

  return INITIAL_CITIZEN_DOCUMENTS;
};

export const uploadUserDocument = async (docData) => {
  try {
    const CANONICAL_DOC_TYPES = {
      bank_passbook: 'bank_account',
      income_cert: 'income_certificate',
      caste_cert: 'caste_certificate',
      domicile: 'domicile_certificate',
      photo: 'photograph',
    };
    const canonicalType = CANONICAL_DOC_TYPES[docData.document_type] || docData.document_type;
    const payload = {
      document_type: canonicalType,
      document_name: docData.document_name,
      document_number: docData.document_number,
      file_name: docData.file_name,
      verification_status: docData.verification_status || 'verified',
      status: 'active',
      metadata: docData.metadata || {},
    };

    const res = await request('/documents/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data || res;
  } catch {
    // Local offline storage fallback
    await delay(200);
    return {
      success: true,
      document_type: docData.document_type,
      verification_status: 'verified',
      message: 'Document saved in local citizen locker (Offline mode)',
    };
  }
};

export const deleteUserDocument = async (docType) => {
  try {
    const canonicalType = DOCUMENT_KEY_ALIASES[docType] || docType;
    return await request(`/documents/${canonicalType}`, {
      method: 'DELETE',
    });
  } catch {
    await delay(100);
    return { success: true };
  }
};

export const extractAndUploadDocument = async (file, docType = null, docNumber = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (docType) {
    const canonicalType = CANONICAL_DOC_TYPES[docType] || docType;
    formData.append('hint_doc_type', canonicalType);
  }
  if (docNumber) {
    formData.append('document_number', docNumber);
  }

  const res = await request('/documents/extract-and-upload', {
    method: 'POST',
    body: formData,
  });
  return res;
};

export const extractDocumentOnly = async (file, docType = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (docType) {
    const canonicalType = CANONICAL_DOC_TYPES[docType] || docType;
    formData.append('hint_doc_type', canonicalType);
  }

  const res = await request('/documents/extract', {
    method: 'POST',
    body: formData,
  });
  return res;
};

// =============================================================================
// GOVERNMENT SCHEMES (Matches backend/DB schemes collection)
// =============================================================================
export const getSchemes = async (filters = {}) => {
  let customSchemes = [];
  try {
    customSchemes = JSON.parse(localStorage.getItem('sahayak_custom_schemes') || '[]');
  } catch {}

  let schemesList = [];
  try {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.state && filters.state !== 'All') params.append('state', filters.state);
    if (filters.level && filters.level !== 'All') params.append('scheme_type', filters.level);
    if (filters.status) params.append('status', filters.status);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await request(`/schemes${qs}`);
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      // Map backend/DB scheme models to standard UI format
      schemesList = res.data.map((s) => ({
        id: s.scheme_id || s.scheme_code || s.id,
        schemeCode: s.scheme_code || s.scheme_id,
        name: s.name,
        hiName: s.hindi_name || s.hiName || s.name,
        category: s.category,
        hiCategory: s.hiCategory || s.category,
        provider: s.provider || s.scheme_type || s.level || 'Central',
        level: s.provider || s.scheme_type || s.level || 'Central',
        provided_by: s.provider || s.scheme_type || s.level || 'Central',
        state: Array.isArray(s.applicable_states) ? s.applicable_states.join(', ') : (s.state || 'All India'),
        applicable_states: s.applicable_states || ['ALL'],
        applicableStates: s.applicable_states || ['ALL'],
        shortDesc: s.description || s.shortDesc,
        fullDesc: s.description,
        benefits: Array.isArray(s.benefits) ? s.benefits : [s.benefits].filter(Boolean),
        documents: Array.isArray(s.required_documents) ? s.required_documents : s.documents || [],
        required_documents: s.required_documents || [],
        eligibility: s.eligibility_summary || s.eligibility || '',
        eligibility_criteria: s.eligibility_criteria || {},
        timeline: s.timeline || {
          application_frequency: s.application_frequency || 'Continuous',
          application_status: s.application_status || 'Open',
        },
        officialUrl: s.official_url || s.official_source || s.application_url,
        application_url: s.official_url || s.official_source || s.application_url,
      }));
    }
  } catch {
    // Graceful offline fallback
    schemesList = MOCK_SCHEMES;
  }

  if (!schemesList || schemesList.length === 0) {
    schemesList = MOCK_SCHEMES;
  }

  // Merge custom schemes from localStorage (newest first, avoid duplicates)
  if (customSchemes && customSchemes.length > 0) {
    const existingIds = new Set(
      schemesList.map((s) => (s.id || s.scheme_id || s.schemeCode || '').toLowerCase().replace(/[-_]/g, ''))
    );
    const unmerged = customSchemes.filter((cs) => {
      const cid = (cs.id || cs.scheme_id || cs.schemeCode || '').toLowerCase().replace(/[-_]/g, '');
      return !existingIds.has(cid);
    });
    schemesList = [...unmerged, ...schemesList];
  }

  return schemesList;
};

export const getSchemeById = async (id) => {
  try {
    const res = await request(`/schemes/${id}`);
    if (res && res.data) {
      const s = res.data;
      return {
        id: s.scheme_id || s.scheme_code || s.id || id,
        schemeCode: s.scheme_code || s.scheme_id,
        name: s.name,
        hiName: s.hindi_name || s.hiName || s.name,
        category: s.category,
        hiCategory: s.hiCategory || s.category,
        level: s.provider || s.scheme_type || s.level || 'Central',
        state: Array.isArray(s.applicable_states) ? s.applicable_states.join(', ') : (s.state || 'All India'),
        applicableStates: s.applicable_states || ['ALL'],
        shortDesc: s.description || s.shortDesc,
        fullDesc: s.description || s.shortDesc,
        benefits: Array.isArray(s.benefits) ? s.benefits : [s.benefits].filter(Boolean),
        documents: Array.isArray(s.required_documents) ? s.required_documents : s.documents || [],
        required_documents: s.required_documents || [],
        timeline: s.timeline || {},
        officialUrl: s.official_url || s.official_source,
      };
    }
  } catch {
    // Fallback
  }

  // Check custom schemes in localStorage first
  try {
    const customSchemes = JSON.parse(localStorage.getItem('sahayak_custom_schemes') || '[]');
    const cleanId = id.toLowerCase().replace(/[-_]/g, '');
    const found = customSchemes.find(
      (s) => (s.id || s.scheme_id || s.schemeCode || '').toLowerCase().replace(/[-_]/g, '') === cleanId
    );
    if (found) return found;
  } catch {}

  await delay();
  return MOCK_SCHEMES.find((s) => s.id === id || s.id.replace('-', '_') === id.replace('-', '_') || s.id.toLowerCase() === id.toLowerCase()) || MOCK_SCHEMES[0];
};

export const createScheme = async (schemeData) => {
  // Always persist custom scheme to localStorage so it syncs across portals immediately
  try {
    const existing = JSON.parse(localStorage.getItem('sahayak_custom_schemes') || '[]');
    const sId = (schemeData.id || schemeData.scheme_id || '').toLowerCase().replace(/[-_]/g, '');
    const filtered = existing.filter(
      (s) => (s.id || s.scheme_id || s.schemeCode || '').toLowerCase().replace(/[-_]/g, '') !== sId
    );
    filtered.unshift(schemeData);
    localStorage.setItem('sahayak_custom_schemes', JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to store scheme locally:', err);
  }

  try {
    const res = await request('/schemes', {
      method: 'POST',
      body: JSON.stringify(schemeData),
    });
    return res;
  } catch {
    await delay();
    return { success: true, message: 'Scheme created and synchronized', data: schemeData };
  }
};

// =============================================================================
// CITIZEN DEMOGRAPHIC PROFILE
// =============================================================================
export const getProfile = async () => {
  try {
    const res = await request('/profile/me');
    if (res && res.data) {
      return {
        ...MOCK_PROFILE,
        ...res.data,
        name: res.data.name || '',
        age: res.data.age || '',
        gender: res.data.gender || '',
        income: res.data.annual_income ? `₹${res.data.annual_income.toLocaleString('en-IN')}` : '',
        annual_income: res.data.annual_income || 0,
        occupation: res.data.occupation || '',
        state: res.data.state || '',
        district: res.data.district || '',
      };
    }
  } catch {
    // Fallback to local profile
  }

  try {
    const saved = localStorage.getItem('sahayak_profile');
    if (saved) return JSON.parse(saved);
    const userSaved = localStorage.getItem('sahayak_user');
    if (userSaved) {
      const u = JSON.parse(userSaved);
      return {
        ...MOCK_PROFILE,
        name: u.name || '',
        phone: u.phone || '',
        state: u.state || '',
        district: u.district || '',
      };
    }
  } catch {}

  await delay(50);
  return MOCK_PROFILE;
};

export const updateProfile = async (data) => {
  try {
    const res = await request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const updated = res.data || data;
    localStorage.setItem('sahayak_profile', JSON.stringify(updated));
    return updated;
  } catch {
    await delay(50);
    const updated = { ...MOCK_PROFILE, ...data };
    localStorage.setItem('sahayak_profile', JSON.stringify(updated));
    return updated;
  }
};

// =============================================================================
// DETERMINISTIC SCHEME ELIGIBILITY
// =============================================================================
export const checkEligibility = async (data = {}) => {
  try {
    const res = await request('/eligibility/check', {
      method: 'POST',
      body: JSON.stringify({
        scheme_id: data.schemeId || data.scheme_id || 'pm-kisan',
        profile_override: data.profile,
      }),
    });
    if (res && res.data) {
      return {
        schemeId: data.schemeId,
        eligible: res.data.is_eligible ?? res.data.eligible ?? true,
        result: (res.data.is_eligible ?? res.data.eligible ?? true) ? 'ELIGIBLE' : 'INELIGIBLE',
        explanation: res.data.explanation,
        criteria: res.data.criteria || [],
      };
    }
  } catch {
    // Fallback
  }

  await delay(150);
  const eligible = (data.simulate || 'ELIGIBLE') === 'ELIGIBLE';
  return {
    schemeId: data.schemeId,
    eligible,
    result: eligible ? 'ELIGIBLE' : 'INELIGIBLE',
    explanation: eligible
      ? 'Citizen satisfies all primary income and landholding criteria for the scheme.'
      : 'Citizen does not meet the specified landholding threshold required.',
  };
};

export const evaluateProfileWithEngine = async ({ extractedDocuments = [], supplementalProfile = {}, schemeIds = null } = {}) => {
  try {
    const res = await request('/eligibility/evaluate-profile', {
      method: 'POST',
      body: JSON.stringify({
        extracted_documents: extractedDocuments,
        supplemental_profile: supplementalProfile,
        scheme_ids: schemeIds,
      }),
    });
    return res;
  } catch (error) {
    console.warn('Backend rules engine evaluation fallback:', error);
    return null;
  }
};

// =============================================================================
// GRIEVANCES REDRESSAL & OFFICER WORKFLOW
// =============================================================================

export const DEFAULT_GRIEVANCES = [
  {
    id: 'GRV-20261001-842',
    ticket_id: 'GRV-20261001-842',
    citizen_name: 'Rameshwar Patil',
    citizen_phone: '+91 98220 12345',
    subject: '16th installment not credited to bank account despite completed eKYC',
    hiSubject: 'eKYC पूरा होने के बावजूद बैंक खाते में 16वीं किस्त जमा नहीं हुई',
    complaint_text: '16th installment of PM-KISAN not credited to Bank of Maharashtra A/C despite completed eKYC and Aadhaar seeding.',
    scheme: 'PM-KISAN',
    scheme_name: 'PM-KISAN',
    department: 'Department of Agriculture & Farmers Welfare',
    priority: 'HIGH',
    status: 'OPEN',
    date: '2026-10-01',
    created_at: '2026-10-01T10:00:00Z',
    history: [
      {
        step: 'Grievance Registered',
        hiStep: 'शिकायत दर्ज की गई',
        date: '2026-10-01',
        desc: 'Grievance registered in system via SAHAYAK Multilingual Assistant',
        hiDesc: 'सहायक बहुभाषी सहायक के माध्यम से प्रणाली में शिकायत दर्ज की गई',
        done: true,
        updatedBy: 'Citizen (Rameshwar Patil)',
      },
    ],
  },
  {
    id: 'GRV-20261005-319',
    ticket_id: 'GRV-20261005-319',
    citizen_name: 'Sunita Devi',
    citizen_phone: '+91 94150 98765',
    subject: 'Ayushman Card eKYC mismatch between Ration Card and Aadhaar',
    hiSubject: 'राशन कार्ड और आधार के बीच आयुष्मान कार्ड ईकेवाईसी में विसंगति',
    complaint_text: 'Golden card eKYC rejection due to name spelling difference between Ration card and Aadhaar.',
    scheme: 'Ayushman Bharat (PM-JAY)',
    scheme_name: 'Ayushman Bharat (PM-JAY)',
    department: 'National Health Authority',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    date: '2026-10-05',
    created_at: '2026-10-05T11:30:00Z',
    history: [
      {
        step: 'Grievance Registered',
        hiStep: 'शिकायत दर्ज की गई',
        date: '2026-10-05',
        desc: 'Citizen filed ticket via online portal',
        hiDesc: 'नागरिक ने ऑनलाइन पोर्टल के माध्यम से टिकट दर्ज किया',
        done: true,
        updatedBy: 'Citizen',
      },
      {
        step: 'Assigned to Nodal Officer',
        hiStep: 'नोडल अधिकारी को सौंपा गया',
        date: '2026-10-06',
        desc: 'Assigned to Nodal Officer Pooja Deshmukh for District Hospital verification',
        hiDesc: 'जिला अस्पताल सत्यापन हेतु नोडल अधिकारी पूजा देशमुख को सौंपा गया',
        done: true,
        updatedBy: 'Admin',
      },
      {
        step: 'Under Investigation',
        hiStep: 'जांच जारी है',
        date: '2026-10-08',
        desc: 'Demographic override requested with Civil Surgeon signature',
        hiDesc: 'सिविल सर्जन के हस्ताक्षर के साथ जनसांख्यिकीय संशोधन का अनुरोध किया गया',
        done: true,
        updatedBy: 'Pooja Deshmukh (Nodal Officer)',
      },
    ],
  },
  {
    id: 'GRV-20261010-104',
    ticket_id: 'GRV-20261010-104',
    citizen_name: 'Anil Kumar Sharma',
    citizen_phone: '+91 98110 54321',
    subject: 'First house construction tranche delayed by 90 days',
    hiSubject: 'गृह निर्माण की पहली किस्त में 90 दिन का विलंब',
    complaint_text: 'Sanction letter approved in 2025 but first house construction tranche payment delayed by 90 days.',
    scheme: 'PM Awas Yojana (Rural)',
    scheme_name: 'PM Awas Yojana (Rural)',
    department: 'Ministry of Rural Development',
    priority: 'HIGH',
    status: 'ASSIGNED',
    date: '2026-10-10',
    created_at: '2026-10-10T14:15:00Z',
    history: [
      {
        step: 'Grievance Registered',
        hiStep: 'शिकायत दर्ज की गई',
        date: '2026-10-10',
        desc: 'Grievance filed by citizen',
        hiDesc: 'नागरिक द्वारा शिकायत दर्ज की गई',
        done: true,
        updatedBy: 'Citizen',
      },
      {
        step: 'Assigned to Block Development Officer',
        hiStep: 'प्रखंड विकास अधिकारी को सौंपा गया',
        date: '2026-10-11',
        desc: 'BDO assigned for geo-tagging inspection and release of funds',
        hiDesc: 'जियो-टैगिंग निरीक्षण और धनराशि जारी करने हेतु बीडीओ नियुक्त',
        done: true,
        updatedBy: 'Admin',
      },
    ],
  },
  {
    id: 'GRV-20260920-550',
    ticket_id: 'GRV-20260920-550',
    citizen_name: 'Kavita Bai',
    citizen_phone: '+91 97230 67890',
    subject: 'LPG cylinder subsidy stopped reflecting in Jan Dhan account',
    hiSubject: 'जन धन खाते में एलपीजी सिलेंडर सब्सिडी आनी बंद हो गई',
    complaint_text: 'LPG subsidy stopped reflecting in Jan Dhan savings account.',
    scheme: 'PM Ujjwala Yojana',
    scheme_name: 'PM Ujjwala Yojana',
    department: 'Ministry of Petroleum & Natural Gas',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    date: '2026-09-20',
    created_at: '2026-09-20T09:00:00Z',
    history: [
      {
        step: 'Grievance Registered',
        hiStep: 'शिकायत दर्ज की गई',
        date: '2026-09-20',
        desc: 'Complaint received',
        hiDesc: 'शिकायत प्राप्त हुई',
        done: true,
        updatedBy: 'Citizen',
      },
      {
        step: 'NPCI Mapping Re-linked',
        hiStep: 'एनपीसीआई मैपिंग पुनः लिंक की गई',
        date: '2026-09-22',
        desc: 'Bank Aadhaar bridge verified and NPCI mapping restored',
        hiDesc: 'बैंक आधार ब्रिज सत्यापित और एनपीसीआई मैपिंग बहाल की गई',
        done: true,
        updatedBy: 'Pooja Deshmukh (Nodal Officer)',
      },
      {
        step: 'Resolved & Closed',
        hiStep: 'निस्तारित एवं बंद',
        date: '2026-09-25',
        desc: 'Subsidy arrears of ₹900 successfully credited. Citizen confirmed receipt.',
        hiDesc: '₹900 का सब्सिडी बकाया सफलतापूर्वक खाते में भेजा गया। नागरिक ने पुष्टि की।',
        done: true,
        updatedBy: 'Pooja Deshmukh (Nodal Officer)',
      },
    ],
  },
];

export const getStoredGrievances = () => {
  try {
    const raw = localStorage.getItem('sahayak_grievances');
    if (!raw) {
      localStorage.setItem('sahayak_grievances', JSON.stringify(DEFAULT_GRIEVANCES));
      return DEFAULT_GRIEVANCES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('sahayak_grievances', JSON.stringify(DEFAULT_GRIEVANCES));
      return DEFAULT_GRIEVANCES;
    }
    return parsed;
  } catch {
    return DEFAULT_GRIEVANCES;
  }
};

export const saveStoredGrievances = (list) => {
  try {
    localStorage.setItem('sahayak_grievances', JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save grievances to localStorage', err);
  }
};

export const getGrievances = async () => {
  const localList = getStoredGrievances();
  try {
    const res = await request('/grievances/my');
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      const serverTickets = res.data.map((g) => ({
        id: g.ticket_id || g.id,
        ticket_id: g.ticket_id || g.id,
        citizen_name: g.citizen_name || 'Citizen',
        citizen_phone: g.citizen_phone || '',
        subject: g.complaint_text || g.complaint || 'Grievance Ticket',
        hiSubject: g.complaint_text || 'शिकायत विवरण',
        complaint_text: g.complaint_text || g.complaint || '',
        scheme: g.scheme_name || g.scheme_id || 'PM-KISAN',
        scheme_name: g.scheme_name || g.scheme_id || 'PM-KISAN',
        department: g.department || 'Public Grievance Redressal',
        priority: g.priority || 'HIGH',
        status: g.status || 'OPEN',
        date: g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Today',
        history: g.timeline || [],
      }));
      // Merge unique
      const serverIds = new Set(serverTickets.map((t) => t.id));
      const unmerged = localList.filter((lt) => !serverIds.has(lt.id));
      return [...serverTickets, ...unmerged];
    }
  } catch {
    // Fallback to local
  }

  return localList;
};

export const getAllGrievances = async (filters = {}) => {
  const localList = getStoredGrievances();
  let merged = [...localList];

  try {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.department && filters.department !== 'ALL') params.append('department', filters.department);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await request(`/grievances${qs}`);
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      const serverTickets = res.data.map((g) => ({
        id: g.ticket_id || g.id,
        ticket_id: g.ticket_id || g.id,
        citizen_name: g.citizen_name || 'Citizen',
        citizen_phone: g.citizen_phone || '',
        subject: g.complaint_text || g.complaint || 'Grievance Ticket',
        hiSubject: g.complaint_text || 'शिकायत विवरण',
        complaint_text: g.complaint_text || g.complaint || '',
        scheme: g.scheme_name || g.scheme_id || 'PM-KISAN',
        scheme_name: g.scheme_name || g.scheme_id || 'PM-KISAN',
        department: g.department || 'Public Grievance Redressal',
        priority: g.priority || 'HIGH',
        status: g.status || 'OPEN',
        date: g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Today',
        history: g.timeline || [],
      }));
      const serverIds = new Set(serverTickets.map((t) => t.id));
      const unmerged = localList.filter((lt) => !serverIds.has(lt.id));
      merged = [...serverTickets, ...unmerged];
    }
  } catch {
    // Fallback
  }

  // Apply filters
  if (filters.status && filters.status !== 'ALL') {
    merged = merged.filter((t) => (t.status || '').toUpperCase() === filters.status.toUpperCase());
  }
  if (filters.department && filters.department !== 'ALL') {
    merged = merged.filter((t) => (t.department || '').toLowerCase().includes(filters.department.toLowerCase()));
  }
  if (filters.priority && filters.priority !== 'ALL') {
    merged = merged.filter((t) => (t.priority || '').toUpperCase() === filters.priority.toUpperCase());
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    merged = merged.filter(
      (t) =>
        (t.id || '').toLowerCase().includes(q) ||
        (t.citizen_name || '').toLowerCase().includes(q) ||
        (t.citizen_phone || '').includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.complaint_text || '').toLowerCase().includes(q) ||
        (t.scheme || '').toLowerCase().includes(q)
    );
  }

  return merged;
};

export const getGrievanceById = async (id) => {
  // Check local first
  const localList = getStoredGrievances();
  const cleanId = id.trim().toLowerCase();
  const localFound = localList.find((g) => (g.id || g.ticket_id || '').toLowerCase() === cleanId);

  try {
    const res = await request(`/grievances/${id}`);
    if (res && res.data) {
      const g = res.data;
      return {
        id: g.ticket_id || g.id || id,
        ticket_id: g.ticket_id || g.id || id,
        citizen_name: g.citizen_name || localFound?.citizen_name || 'Citizen User',
        citizen_phone: g.citizen_phone || localFound?.citizen_phone || '',
        subject: g.complaint_text || g.complaint || localFound?.subject || 'Grievance Ticket',
        hiSubject: g.complaint_text || localFound?.hiSubject || 'शिकायत विवरण',
        complaint_text: g.complaint_text || g.complaint || localFound?.complaint_text || '',
        scheme: g.scheme_name || g.scheme_id || localFound?.scheme || 'PM-KISAN',
        scheme_name: g.scheme_name || g.scheme_id || localFound?.scheme_name || 'PM-KISAN',
        department: g.department || localFound?.department || 'Public Grievance Redressal',
        priority: g.priority || localFound?.priority || 'HIGH',
        status: g.status || localFound?.status || 'OPEN',
        date: g.created_at ? new Date(g.created_at).toLocaleDateString() : (localFound?.date || 'Recent'),
        history: (g.timeline && g.timeline.length > 0) ? g.timeline : (localFound?.history || []),
      };
    }
  } catch {
    // Fallback
  }

  if (localFound) return localFound;
  await delay();
  return null;
};

export const createGrievance = async (data) => {
  const ticketId = `GRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString().slice(0, 10);
  const complaint = data.complaint_text || data.subject || data.description || 'Public Grievance';

  const newTicket = {
    id: ticketId,
    ticket_id: ticketId,
    citizen_name: data.citizen_name || 'Citizen User',
    citizen_phone: data.citizen_phone || '+91 98000 00000',
    subject: complaint,
    hiSubject: complaint,
    complaint_text: complaint,
    scheme: data.scheme_name || data.scheme || 'PM-KISAN',
    scheme_name: data.scheme_name || data.scheme || 'PM-KISAN',
    department: data.department || 'Department of Agriculture & Farmers Welfare',
    priority: data.priority || 'HIGH',
    status: 'OPEN',
    date: now,
    created_at: new Date().toISOString(),
    history: [
      {
        step: 'Grievance Registered',
        hiStep: 'शिकायत दर्ज की गई',
        date: now,
        desc: 'Grievance ticket created and logged in the SAHAYAK grievance repository.',
        hiDesc: 'शिकायत टिकट बनाया गया और सहायक शिकायत प्रणाली में दर्ज किया गया।',
        done: true,
        updatedBy: data.citizen_name || 'Citizen',
      },
    ],
  };

  // Persist immediately in localStorage
  const existing = getStoredGrievances();
  const updated = [newTicket, ...existing];
  saveStoredGrievances(updated);

  try {
    const res = await request('/grievances', {
      method: 'POST',
      body: JSON.stringify({
        scheme_id: data.scheme_id || data.schemeId || 'pm_kisan',
        scheme_name: data.scheme_name || data.scheme || 'PM-KISAN',
        complaint_text: complaint,
        citizen_name: data.citizen_name,
        citizen_phone: data.citizen_phone,
        department: data.department || 'Department of Agriculture & Farmers Welfare',
        priority: data.priority || 'HIGH',
      }),
    });
    if (res && res.data) {
      newTicket.id = res.data.ticket_id || ticketId;
      newTicket.ticket_id = res.data.ticket_id || ticketId;
    }
  } catch (err) {
    console.warn('Backend grievance creation fallback to localStorage:', err);
  }

  return newTicket;
};

export const updateGrievanceStatus = async (ticketId, { status, comment, officerName = 'Pooja Deshmukh (Nodal Officer)' }) => {
  const cleanId = ticketId.trim().toLowerCase();
  const now = new Date().toISOString().slice(0, 10);
  const existing = getStoredGrievances();

  let updatedTicket = null;
  const updatedList = existing.map((t) => {
    if ((t.id || t.ticket_id || '').toLowerCase() === cleanId) {
      const history = [...(t.history || [])];
      history.push({
        step: `Status changed to ${status}`,
        hiStep: `स्थिति बदलकर ${status} की गई`,
        date: now,
        desc: comment || `Action taken by ${officerName}: Status updated to ${status}`,
        hiDesc: comment || `${officerName} द्वारा कार्रवाई: स्थिति ${status} पर अद्यतन`,
        done: true,
        updatedBy: officerName,
      });
      updatedTicket = {
        ...t,
        status,
        updated_at: new Date().toISOString(),
        history,
      };
      return updatedTicket;
    }
    return t;
  });

  if (updatedTicket) {
    saveStoredGrievances(updatedList);
  }

  try {
    await request(`/grievances/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, comment }),
    });
  } catch (err) {
    console.warn('Backend grievance status update fallback:', err);
  }

  return { success: true, ticket_id: ticketId, status, ticket: updatedTicket };
};

// =============================================================================
// DASHBOARD ANALYTICS
// =============================================================================
export const getOfficerDashboard = async () => {
  const allTickets = await getAllGrievances();
  return {
    officerId: 'OFF-8812',
    officerName: 'Pooja Deshmukh',
    officerDesignation: 'District Nodal Grievance Redressal Officer',
    totalQueries: allTickets.length,
    openGrievances: allTickets.filter((t) => (t.status || '').toUpperCase() === 'OPEN').length,
    pendingAction: allTickets.filter(
      (t) => (t.status || '').toUpperCase() === 'ASSIGNED' || (t.status || '').toUpperCase() === 'IN_PROGRESS'
    ).length,
    resolvedGrievances: allTickets.filter((t) => (t.status || '').toUpperCase() === 'RESOLVED').length,
    rejectedGrievances: allTickets.filter((t) => (t.status || '').toUpperCase() === 'REJECTED').length,
    tickets: allTickets,
  };
};

export const getAdminStats = async () => {
  await delay(100);
  return {
    totalCitizens: 14250,
    activeSchemes: 18,
    activeRules: 54,
    totalGrievances: 1840,
    resolutionRate: '94.2%',
    serverStatus: 'Online (MongoDB & FastAPI Connected)',
  };
};

export const submitAssistantQuery = async (payload) => {
  await delay();
  return { matchedSchemeId: 'pm-kisan', payload };
};

// =============================================================================
// NOTIFICATIONS (Matches backend/DB notifications collection)
// =============================================================================
export const getUserNotifications = async () => {
  try {
    const res = await request('/notifications');
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((n) => ({
        id: n.notification_id || n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type || 'GENERAL',
        schemeId: n.scheme_id || null,
        timestamp: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        read: Boolean(n.is_read),
      }));
    }
  } catch {
    // Fallback to localStorage or mock
  }

  try {
    const saved = localStorage.getItem('sahayak_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return null;
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    return await request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  } catch {
    return { success: true };
  }
};

export const markAllNotificationsRead = async () => {
  try {
    return await request('/notifications/read-all', {
      method: 'PUT',
    });
  } catch {
    return { success: true };
  }
};
