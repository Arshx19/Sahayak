// -----------------------------------------------------------------------------
// SAHAYAK Scheme Eligibility Evaluation Service
// Centralized, deterministic evaluation engine.
// Compares citizen's uploaded documents and socio-economic demographics
// against scheme requirements and produces a transparent visual checklist.
// -----------------------------------------------------------------------------

import { SUPPORTED_DOCUMENTS, getDocumentDefinition, DOCUMENT_KEY_ALIASES } from '../data/documentsData.js';

export function evaluateSchemeEligibility(scheme, citizenDocuments = {}, citizenProfile = {}) {
  const criteriaChecks = [];
  const missingDocuments = [];
  const reasons = [];

  // 1. Evaluate Document Requirements
  const requiredDocs = scheme.required_documents || [];
  requiredDocs.forEach((docId) => {
    const cleanId = String(docId).trim().toLowerCase();
    const docDef = getDocumentDefinition(cleanId) || { name: cleanId.toUpperCase() };
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
      reasons.push(`${docDef.name} is not uploaded`);
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

  // 2. Evaluate Demographic & Geographic Criteria (if defined on the scheme)
  const criteria = scheme.eligibility_criteria || {};

  // State Applicability Check
  if (scheme.provided_by === 'State' || (criteria.required_state && criteria.required_state !== 'All')) {
    const requiredState = criteria.required_state || scheme.state;
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
      reasons.push(`Scheme applies only to residents of ${requiredState} (Your profile state: ${userState})`);
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

  const passedCount = criteriaChecks.filter((c) => c.passed).length;
  const totalCount = criteriaChecks.length;
  const isEligible = passedCount === totalCount && totalCount > 0;

  return {
    schemeId: scheme.id,
    isEligible,
    criteriaChecks,
    missingDocuments,
    reasons,
    passedCount,
    totalCount,
  };
}

/**
 * Batch evaluates all schemes for a citizen and segments them into:
 * - eligibleSchemes (ready to apply)
 * - ineligibleSchemes (missing documents or criteria with visual reasons)
 */
export function evaluateAllSchemes(schemes = [], citizenDocuments = {}, citizenProfile = {}) {
  const eligibleSchemes = [];
  const ineligibleSchemes = [];

  schemes.forEach((scheme) => {
    const evaluation = evaluateSchemeEligibility(scheme, citizenDocuments, citizenProfile);
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
