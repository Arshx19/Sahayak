// -----------------------------------------------------------------------------
// API service layer.
// Every function below currently returns local mock data. When the FastAPI
// backend is ready, replace ONLY the bodies of these functions (see the
// `request` helper) — pages/components keep calling the same functions.
// -----------------------------------------------------------------------------
import { MOCK_SCHEMES } from '../data/schemes.js';
import { MOCK_GRIEVANCES } from '../data/grievances.js';
import { MOCK_PROFILE } from '../data/profile.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// Ready for use once the backend exists, e.g.:
//   return request('/schemes');
// eslint-disable-next-line no-unused-vars
export const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
};

// GET /schemes
export const getSchemes = async () => {
  await delay();
  return MOCK_SCHEMES;
};

// GET /schemes/:id
export const getSchemeById = async (id) => {
  await delay();
  return MOCK_SCHEMES.find((s) => s.id === id) || null;
};

// GET /profile
export const getProfile = async () => {
  await delay();
  return MOCK_PROFILE;
};

// PUT /profile
export const updateProfile = async (data) => {
  await delay();
  return { ...MOCK_PROFILE, ...data };
};

// POST /eligibility/check
// Mock: honours `data.simulate` ('ELIGIBLE' | 'INELIGIBLE') for the demo UI.
export const checkEligibility = async (data = {}) => {
  await delay(150);
  const eligible = (data.simulate || 'ELIGIBLE') === 'ELIGIBLE';
  return { schemeId: data.schemeId, eligible, result: eligible ? 'ELIGIBLE' : 'INELIGIBLE' };
};

// GET /grievances
export const getGrievances = async () => {
  await delay();
  return MOCK_GRIEVANCES;
};

// GET /grievances/:id
export const getGrievanceById = async (id) => {
  await delay();
  return MOCK_GRIEVANCES.find((g) => g.id === id) || null;
};

// POST /grievances
export const createGrievance = async (data) => {
  await delay();
  return { id: `SG-${Math.floor(1000 + Math.random() * 9000)}`, status: 'OPEN', ...data };
};

// GET /officer/dashboard
export const getOfficerDashboard = async () => {
  await delay();
  return {
    officerId: 'OFF-8812',
    totalQueries: 1284,
    openGrievances: 163,
    pendingAction: 42,
    resolvedGrievances: 921,
  };
};

// POST /assistant/query  (future BHASHINI / voice pipeline hook)
export const submitAssistantQuery = async (payload) => {
  await delay();
  return { matchedSchemeId: 'pm-kisan', payload };
};
