import { useState } from 'react';
import { getTranslation } from '../utils/translations.js';
import { checkEligibility } from '../services/api.js';
import EligibilityCard from '../components/EligibilityCard.jsx';

export default function EligibilityPage({ language }) {
  const [selectedScheme, setSelectedScheme] = useState('pm-kisan');
  const [testResult, setTestResult] = useState('ELIGIBLE');
  const hi = language === 'hi';
  const t = (key) => getTranslation(language, key);

  // Frontend simulation only. Later the backend (POST /eligibility/check)
  // returns the real result through checkEligibility() in services/api.js.
  const simulate = async (simulateResult) => {
    const res = await checkEligibility({ schemeId: selectedScheme, simulate: simulateResult });
    setTestResult(res.result);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="border-b border-slate-300 pb-2">
        <h2 className="text-xl font-bold text-[#0f2942]">{t('eligibilityTitle')}</h2>
        <p className="text-xs text-slate-600">{t('eligibilitySub')}</p>
      </div>

      <div className="bg-white border border-slate-300 rounded p-5 space-y-4">
        <div className="space-y-1">
          <label htmlFor="scheme-select" className="text-xs font-bold text-slate-700">{t('selectScheme')}</label>
          <select
            id="scheme-select"
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#0f2942]"
          >
            <option value="pm-kisan">{hi ? 'पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)' : 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)'}</option>
            <option value="old-age-pension">{hi ? 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन' : 'Indira Gandhi National Old Age Pension'}</option>
            <option value="pm-awas">{hi ? 'प्रधानमंत्री आवास योजना (ग्रामीण)' : 'PM Awas Yojana (Rural)'}</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => simulate('ELIGIBLE')}
            className={`px-3 py-1 rounded font-bold border ${testResult === 'ELIGIBLE' ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-700'}`}
          >
            {t('simEligible')}
          </button>
          <button
            onClick={() => simulate('INELIGIBLE')}
            className={`px-3 py-1 rounded font-bold border ${testResult === 'INELIGIBLE' ? 'bg-rose-700 text-white border-rose-800' : 'bg-slate-100 text-slate-700'}`}
          >
            {t('simIneligible')}
          </button>
        </div>

        <EligibilityCard result={testResult} language={language} />
      </div>
    </div>
  );
}
