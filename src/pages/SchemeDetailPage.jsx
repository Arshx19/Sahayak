import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import { getSchemeById, getSchemes } from '../services/api.js';
import LoadingState from '../components/LoadingState.jsx';

export default function SchemeDetailPage({ language }) {
  const { schemeId } = useParams();
  const [scheme, setScheme] = useState(null);
  const hi = language === 'hi';
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    setScheme(null);
    (async () => {
      // Original behaviour: unknown id falls back to the first scheme.
      const found = await getSchemeById(schemeId);
      setScheme(found || (await getSchemes())[0]);
    })();
  }, [schemeId]);

  if (!scheme) return <LoadingState />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <Link to="/schemes" className="text-xs font-bold text-[#1b365d] hover:underline flex items-center gap-1">
        {t('backToSchemes')}
      </Link>

      <div className="bg-white border border-slate-300 rounded p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
            {hi ? scheme.hiCategory : scheme.category}
          </span>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {hi ? scheme.hiLevel : scheme.level} {hi ? 'सरकार' : 'Government'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#1b365d]">{hi ? scheme.hiName : scheme.name}</h2>
        <p className="text-xs text-slate-700 leading-relaxed">{hi ? scheme.hiFullDesc : scheme.fullDesc}</p>
      </div>

      <div className="bg-white border border-slate-300 rounded p-5 space-y-2">
        <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider border-b border-slate-200 pb-1.5">{t('keyBenefits')}</h3>
        <ul className="space-y-1.5 text-xs text-slate-700">
          {(hi ? scheme.hiBenefits : scheme.benefits).map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-slate-300 rounded p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider border-b border-slate-200 pb-1.5">{t('reqDocs')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {(hi ? scheme.hiDocuments : scheme.documents).map((doc, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded flex items-center gap-2">
              <span className="text-amber-600 font-bold" aria-hidden="true">📄</span>
              <span className="text-slate-800 font-medium">{doc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
