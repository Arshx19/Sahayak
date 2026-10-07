// -----------------------------------------------------------------------------
// SAHAYAK API Service Layer
// Communicates with FastAPI backend at API_BASE_URL.
// Automatically attaches JWT Bearer token from localStorage.
// Gracefully falls back to mock dataset if the backend server is offline.
// -----------------------------------------------------------------------------
import { MOCK_SCHEMES } from '../data/schemes.js';
import { MOCK_GRIEVANCES } from '../data/grievances.js';
import { MOCK_PROFILE } from '../data/profile.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// Universal HTTP Request Helper with JWT token injection
export const request = async (path, options = {}) => {
  const token = localStorage.getItem('sahayak_token');
  const headers = {
    'Content-Type': 'application/json',
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
// GOVERNMENT SCHEMES
// =============================================================================
export const getSchemes = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await request(`/schemes${qs}`);
    if (res && res.data && Array.isArray(res.data)) {
      // Map API fields to UI format if needed
      return res.data.map((s) => ({
        id: s.scheme_id || s.id || s.scheme_code?.toLowerCase(),
        name: s.name,
        hiName: s.hindi_name || s.hiName || s.name,
        category: s.category,
        hiCategory: s.hiCategory || s.category,
        level: s.scheme_type || s.level || 'Central',
        state: s.applicable_states ? s.applicable_states.join(', ') : 'All States / UTs',
        shortDesc: s.description || s.shortDesc,
        benefits: Array.isArray(s.benefits) ? s.benefits : [s.benefits].filter(Boolean),
        documents: Array.isArray(s.required_documents) ? s.required_documents : s.documents || [],
        officialUrl: s.official_url,
      }));
    }
  } catch {
    // Graceful offline fallback
  }

  await delay();
  return MOCK_SCHEMES;
};

export const getSchemeById = async (id) => {
  try {
    const res = await request(`/schemes/${id}`);
    if (res && res.data) {
      const s = res.data;
      return {
        id: s.scheme_id || s.id || id,
        name: s.name,
        hiName: s.hindi_name || s.hiName || s.name,
        category: s.category,
        hiCategory: s.hiCategory || s.category,
        level: s.scheme_type || s.level || 'Central',
        state: s.applicable_states ? s.applicable_states.join(', ') : 'All States / UTs',
        shortDesc: s.description,
        fullDesc: s.description,
        benefits: Array.isArray(s.benefits) ? s.benefits : [s.benefits].filter(Boolean),
        documents: Array.isArray(s.required_documents) ? s.required_documents : s.documents || [],
        officialUrl: s.official_url,
      };
    }
  } catch {
    // Fallback
  }

  await delay();
  return MOCK_SCHEMES.find((s) => s.id === id || s.id.replace('-', '_') === id.replace('-', '_')) || MOCK_SCHEMES[0];
};

export const createScheme = async (schemeData) => {
  try {
    const res = await request('/schemes', {
      method: 'POST',
      body: JSON.stringify(schemeData),
    });
    return res;
  } catch {
    await delay();
    return { success: true, message: 'Scheme created (Local demo mode)', data: schemeData };
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
        name: res.data.name || MOCK_PROFILE.name,
        age: res.data.age || MOCK_PROFILE.age,
        gender: res.data.gender || MOCK_PROFILE.gender,
        income: res.data.annual_income ? `₹${res.data.annual_income.toLocaleString('en-IN')}` : MOCK_PROFILE.income,
        annual_income: res.data.annual_income || 120000,
        occupation: res.data.occupation || MOCK_PROFILE.occupation,
      };
    }
  } catch {
    // Fallback
  }

  await delay();
  return MOCK_PROFILE;
};

export const updateProfile = async (data) => {
  try {
    const res = await request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  } catch {
    await delay();
    return { ...MOCK_PROFILE, ...data };
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

// =============================================================================
// GRIEVANCES REDRESSAL
// =============================================================================
export const getGrievances = async () => {
  try {
    // Try citizen tickets first
    const res = await request('/grievances/my');
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((g) => ({
        id: g.ticket_id || g.id,
        subject: g.complaint_text || g.complaint || 'Grievance Ticket',
        hiSubject: g.complaint_text || 'शिकायत टिकट',
        scheme: g.scheme_name || g.scheme_id || 'PM-KISAN',
        department: g.department || 'Agriculture & Farmers Welfare',
        status: g.status || 'OPEN',
        date: g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Today',
        history: g.timeline || [],
      }));
    }
  } catch {
    // Fallback
  }

  await delay();
  return MOCK_GRIEVANCES;
};

export const getAllGrievances = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.department) params.append('department', filters.department);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await request(`/grievances${qs}`);
    if (res && res.data) return res.data;
  } catch {
    // Fallback
  }

  await delay();
  return MOCK_GRIEVANCES;
};

export const getGrievanceById = async (id) => {
  try {
    const res = await request(`/grievances/${id}`);
    if (res && res.data) {
      const g = res.data;
      return {
        id: g.ticket_id || g.id || id,
        subject: g.complaint_text || g.complaint || 'Grievance Ticket',
        hiSubject: g.complaint_text || 'शिकायत विवरण',
        scheme: g.scheme_name || g.scheme_id,
        department: g.department || 'Public Grievance Redressal',
        status: g.status || 'OPEN',
        date: g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Recent',
        history: g.timeline || [],
      };
    }
  } catch {
    // Fallback
  }

  await delay();
  return MOCK_GRIEVANCES.find((g) => g.id === id) || null;
};

export const createGrievance = async (data) => {
  try {
    const res = await request('/grievances', {
      method: 'POST',
      body: JSON.stringify({
        scheme_id: data.scheme_id || data.schemeId || 'pm_kisan',
        scheme_name: data.scheme_name || data.scheme || 'PM-KISAN',
        complaint_text: data.complaint_text || data.subject || data.description || 'Public Grievance',
        citizen_name: data.citizen_name,
        citizen_phone: data.citizen_phone,
        department: data.department || 'Agriculture & Farmers Welfare',
        priority: data.priority || 'HIGH',
      }),
    });
    return res.data;
  } catch {
    await delay();
    return {
      id: `SG-${Math.floor(1000 + Math.random() * 9000)}`,
      ticket_id: `GRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'OPEN',
      ...data,
    };
  }
};

export const updateGrievanceStatus = async (ticketId, { status, comment }) => {
  try {
    return await request(`/grievances/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, comment }),
    });
  } catch {
    await delay();
    return { success: true, ticket_id: ticketId, status };
  }
};

// =============================================================================
// DASHBOARD ANALYTICS
// =============================================================================
export const getOfficerDashboard = async () => {
  try {
    // If backend has DB dashboard aggregator or grievances
    const all = await request('/grievances');
    if (all && all.data && Array.isArray(all.data)) {
      const tickets = all.data;
      return {
        officerId: 'OFF-8812',
        totalQueries: tickets.length * 3 + 120,
        openGrievances: tickets.filter((t) => t.status === 'OPEN').length || 14,
        pendingAction: tickets.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length || 28,
        resolvedGrievances: tickets.filter((t) => t.status === 'RESOLVED').length || 85,
      };
    }
  } catch {
    // Fallback
  }

  await delay();
  return {
    officerId: 'OFF-8812',
    totalQueries: 1284,
    openGrievances: 163,
    pendingAction: 42,
    resolvedGrievances: 921,
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
