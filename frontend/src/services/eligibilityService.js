// -----------------------------------------------------------------------------
// SAHAYAK Scheme Eligibility Evaluation Service
// Centralized, deterministic evaluation engine.
// Compares citizen's uploaded documents and socio-economic demographics
// against scheme requirements and produces a transparent visual checklist.
// Supports both offline client-side evaluation and backend AI Rules Engine sync.
// -----------------------------------------------------------------------------

import { SUPPORTED_DOCUMENTS, getDocumentDefinition, DOCUMENT_KEY_ALIASES } from '../data/documentsData.js';

// Scheme code aliases mapping
const SCHEME_ALIASES = {
  'pm_kisan': ['cen001', 'sch_pm_kisan_001'],
  'pm-kisan': ['cen001', 'sch_pm_kisan_001'],
  'cen001': ['pm_kisan', 'sch_pm_kisan_001'],
  'pm_jay': ['cen002', 'sch_ab_pmjay_002'],
  'pm-jay': ['cen002', 'sch_ab_pmjay_002'],
  'cen002': ['pm_jay', 'sch_ab_pmjay_002'],
  'pmay_g': ['cen003', 'sch_pmay_g_003'],
  'pm-svanidhi': ['cen007', 'sch_pm_svanidhi_004', 'cen004'],
  'cen007': ['sch_pm_svanidhi_004'],
  'pmsby': ['cen007'],
  'apy': ['cen005'],
  'cen005': ['apy'],
};

export function evaluateSchemeEligibility(
  scheme,
  citizenDocuments = {},
  citizenProfile = {},
  serverEvaluationsMap = null
) {
  const schemeKey = (scheme.id || scheme.scheme_id || '').toLowerCase();
  
  // 1. Check if backend Rules Engine evaluation exists for this scheme
  let serverEval = null;
  if (serverEvaluationsMap) {
    serverEval = serverEvaluationsMap[schemeKey] || serverEvaluationsMap[scheme.id] || serverEvaluationsMap[scheme.scheme_id];
    if (!serverEval) {
      // Check aliases
      const aliases = SCHEME_ALIASES[schemeKey] || [];
      for (const alias of aliases) {
        if (serverEvaluationsMap[alias]) {
          serverEval = serverEvaluationsMap[alias];
          break;
        }
      }
    }
  }

  // If server evaluation is available, map it directly into the rich explainable contract
  if (serverEval) {
    const passedList = serverEval.passed || [];
    const failedList = serverEval.failed || [];
    const unverifiedList = serverEval.unverified || [];
    const missingDocs = serverEval.missing_documents || [];
    const status = serverEval.status || (serverEval.is_eligible ? 'eligible' : 'not_eligible');
    const isEligible = status === 'eligible';

    const criteriaChecks = [];
    const reasons = [];

    // Add passed conditions
    passedList.forEach((p, idx) => {
      criteriaChecks.push({
        id: `srv_pass_${idx}`,
        label: p.condition || 'Rule Met',
        type: 'CRITERIA',
        required: true,
        passed: true,
        detail: p.applicant_value ? `Satisfied (${p.applicant_value})` : 'Verified & Satisfied',
      });
    });

    // Add failed conditions
    failedList.forEach((f, idx) => {
      const reason = f.reason || (f.applicant_value ? `Failed: Got ${f.applicant_value}` : 'Condition not met');
      reasons.push(reason);
      criteriaChecks.push({
        id: `srv_fail_${idx}`,
        label: f.condition || 'Rule Not Met',
        type: 'CRITERIA',
        required: true,
        passed: false,
        detail: reason,
      });
    });

    // Add unverified conditions (needs_info)
    unverifiedList.forEach((u, idx) => {
      criteriaChecks.push({
        id: `srv_unv_${idx}`,
        label: u.condition || 'Needs Verification',
        type: 'UNVERIFIED',
        required: true,
        passed: false,
        unverified: true,
        detail: `Requires Clear Document: ${u.missing || 'Unverified field'}`,
      });
    });

    // Add missing documents
    missingDocs.forEach((docId) => {
      const cleanId = String(docId).trim().toLowerCase();
      const docDef = getDocumentDefinition(cleanId) || { name: cleanId.replace(/_/g, ' ').toUpperCase() };
      reasons.push(`${docDef.name} has not been uploaded to your document locker.`);
      criteriaChecks.push({
        id: `doc_${cleanId}`,
        docId: cleanId,
        label: docDef.name,
        type: 'DOCUMENT',
        required: true,
        passed: false,
        detail: 'Document not uploaded',
      });
    });

    const passedCount = criteriaChecks.filter((c) => c.passed).length;
    const totalCount = criteriaChecks.length;

    return {
      schemeId: scheme.id || scheme.scheme_id,
      isEligible,
      status,
      criteriaChecks,
      missingDocuments: missingDocs,
      reasons,
      passedCount,
      totalCount,
      unverifiedCount: unverifiedList.length,
      serverEvaluated: true,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Client-side deterministic evaluation fallback
  // ---------------------------------------------------------------------------
  const criteriaChecks = [];
  const missingDocuments = [];
  const reasons = [];

  // 2A. Evaluate Document Requirements
  const requiredDocs = scheme.required_documents || [];
  requiredDocs.forEach((docId) => {
    const cleanId = String(docId).trim().toLowerCase();
    const docDef = getDocumentDefinition(cleanId) || { name: cleanId.replace(/_/g, ' ').toUpperCase() };
    const aliasKey = DOCUMENT_KEY_ALIASES[cleanId];

    // Look up either canonical key or alias in citizen documents
    const userDoc = citizenDocuments[cleanId] || (aliasKey ? citizenDocuments[aliasKey] : null);
    const isUploaded = userDoc && (userDoc.status === 'VERIFIED' || userDoc.status === 'UPLOADED');

    if (isUploaded) {
      criteriaChecks.push({
        id: `doc_${cleanId}`,
        docId: cleanId,
        label: docDef.name,
        type: 'DOCUMENT',
        required: true,
        passed: true,
        detail: userDoc.status === 'VERIFIED' ? 'Uploaded & Verified' : 'Uploaded (Pending Review)',
      });
    } else {
      missingDocuments.push(cleanId);
      reasons.push(`${docDef.name} has not been uploaded to your document locker.`);
      criteriaChecks.push({
        id: `doc_${cleanId}`,
        docId: cleanId,
        label: docDef.name,
        type: 'DOCUMENT',
        required: true,
        passed: false,
        detail: 'Document not uploaded',
      });
    }
  });

  // 2B. Evaluate Demographic & Geographic Criteria
  const criteria = scheme.eligibility_criteria || {};

  // State Applicability Check
  const isStateScheme = scheme.provider === 'State' || scheme.provided_by === 'State' || scheme.level === 'State' || scheme.scheme_type === 'State';
  if (isStateScheme) {
    const requiredState = scheme.state;
    const userState = citizenProfile.state || 'Maharashtra';
    const isStateMatch = !requiredState || requiredState.includes('All') || userState.toLowerCase() === requiredState.toLowerCase();

    if (isStateMatch) {
      criteriaChecks.push({
        id: 'crit_state',
        label: `State Domicile: ${requiredState}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: true,
        detail: `Citizen state matches (${userState})`,
      });
    } else {
      reasons.push(`This scheme is only available to residents of ${requiredState}. (Your declared state: ${userState})`);
      criteriaChecks.push({
        id: 'crit_state',
        label: `State Domicile: ${requiredState}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: false,
        detail: `Your profile state is ${userState}`,
      });
    }
  }

  // Maximum Annual Income Check
  if (criteria.max_income !== undefined) {
    const userIncome = citizenProfile.annual_income || 120000;
    const passed = userIncome <= criteria.max_income;
    const formattedMax = `₹${criteria.max_income.toLocaleString('en-IN')}`;
    const formattedUser = `₹${userIncome.toLocaleString('en-IN')}`;

    if (passed) {
      criteriaChecks.push({
        id: 'crit_income',
        label: `Annual Income: Up to ${formattedMax}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: true,
        detail: `Your declared income: ${formattedUser}`,
      });
    } else {
      reasons.push(`Annual income must be below ${formattedMax} (Your declared income: ${formattedUser})`);
      criteriaChecks.push({
        id: 'crit_income',
        label: `Annual Income: Up to ${formattedMax}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: false,
        detail: `Exceeds threshold (${formattedUser})`,
      });
    }
  }

  // Primary Occupation Check
  if (criteria.occupation) {
    const userOcc = (citizenProfile.occupation || 'farmer').toLowerCase();
    const reqOcc = criteria.occupation.toLowerCase();
    const passed = userOcc.includes(reqOcc) || (reqOcc === 'farmer' && (citizenProfile.land_acres || 0) > 0);

    if (passed) {
      criteriaChecks.push({
        id: 'crit_occ',
        label: `Occupation: ${criteria.occupation.toUpperCase()}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: true,
        detail: `Matches primary occupation (${citizenProfile.occupation || 'Farmer'})`,
      });
    } else {
      reasons.push(`Scheme is designated for ${criteria.occupation}s`);
      criteriaChecks.push({
        id: 'crit_occ',
        label: `Occupation: ${criteria.occupation.toUpperCase()}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: false,
        detail: `Current occupation: ${citizenProfile.occupation}`,
      });
    }
  }

  // Gender Criteria Check
  if (criteria.gender) {
    const userGender = (citizenProfile.gender || 'male').toLowerCase();
    const reqGender = criteria.gender.toLowerCase();
    const passed = reqGender === 'all' || userGender === reqGender;
    if (passed) {
      criteriaChecks.push({
        id: 'crit_gender',
        label: `Gender Eligibility: ${criteria.gender.toUpperCase()}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: true,
        detail: `Citizen gender matches (${citizenProfile.gender || 'Female'})`,
      });
    } else {
      reasons.push(`Scheme is designated for ${criteria.gender} applicants`);
      criteriaChecks.push({
        id: 'crit_gender',
        label: `Gender Eligibility: ${criteria.gender.toUpperCase()}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: false,
        detail: `Current profile gender is ${citizenProfile.gender}`,
      });
    }
  }

  // Social Category / Caste Check
  if (criteria.caste_category || criteria.social_category) {
    const reqCategory = (criteria.caste_category || criteria.social_category).toLowerCase();
    const userCategory = (citizenProfile.caste_category || citizenProfile.social_category || 'general').toLowerCase();
    const passed = reqCategory === 'all' || userCategory === reqCategory || (Array.isArray(criteria.caste_category) && criteria.caste_category.map(c => c.toLowerCase()).includes(userCategory));
    if (passed) {
      criteriaChecks.push({
        id: 'crit_category',
        label: `Category: ${String(criteria.caste_category || criteria.social_category).toUpperCase()}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: true,
        detail: `Citizen category matches (${userCategory.toUpperCase()})`,
      });
    } else {
      reasons.push(`Scheme requires category ${criteria.caste_category || criteria.social_category}`);
      criteriaChecks.push({
        id: 'crit_category',
        label: `Category: ${String(criteria.caste_category || criteria.social_category).toUpperCase()}`,
        type: 'DEMOGRAPHIC',
        required: true,
        passed: false,
        detail: `Current profile category is ${userCategory.toUpperCase()}`,
      });
    }
  }

  const passedCount = criteriaChecks.filter((c) => c.passed).length;
  const totalCount = criteriaChecks.length;
  const isEligible = passedCount === totalCount && totalCount > 0;
  const status = isEligible ? 'eligible' : (missingDocuments.length > 0 ? 'needs_info' : 'not_eligible');

  return {
    schemeId: scheme.id || scheme.scheme_id,
    isEligible,
    status,
    criteriaChecks,
    missingDocuments,
    reasons,
    passedCount,
    totalCount,
    unverifiedCount: 0,
    serverEvaluated: false,
  };
}

/**
 * Batch evaluates all schemes for a citizen and segments them into:
 * - eligibleSchemes (ready to apply)
 * - ineligibleSchemes (missing documents or criteria with visual reasons)
 */
export function evaluateAllSchemes(
  schemes = [],
  citizenDocuments = {},
  citizenProfile = {},
  serverEvaluationsMap = null
) {
  const eligibleSchemes = [];
  const ineligibleSchemes = [];

  schemes.forEach((scheme) => {
    const evaluation = evaluateSchemeEligibility(scheme, citizenDocuments, citizenProfile, serverEvaluationsMap);
    const enrichedScheme = {
      ...scheme,
      evaluation,
      isEligible: evaluation.isEligible,
    };

    if (evaluation.isEligible) {
      eligibleSchemes.push(enrichedScheme);
    } else {
      ineligibleSchemes.push(enrichedScheme);
    }
  });

  return {
    eligibleSchemes,
    ineligibleSchemes,
    totalSchemesCount: schemes.length,
    eligibleCount: eligibleSchemes.length,
    ineligibleCount: ineligibleSchemes.length,
  };
}
