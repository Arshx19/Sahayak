import { useEffect, useState } from 'react';
import { getTranslation } from '../utils/translations.js';
import { getOfficerDashboard } from '../services/api.js';
import LoadingState from '../components/LoadingState.jsx';

export default function OfficerDashboardPage({ language }) {
  const [data, setData] = useState(null);
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    getOfficerDashboard().then(setData);
  }, []);

  const stats = data && [
    { label: t('totalQueries'), value: data.totalQueries.toLocaleString('en-IN'), color: 'text-[#1b365d]' },
    { label: t('openGrievances'), value: data.openGrievances, color: 'text-rose-700' },
    { label: t('pending'), value: data.pendingAction, color: 'text-amber-700' },
    { label: t('resolved'), value: data.resolvedGrievances, color: 'text-emerald-700' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="border-b border-slate-300 pb-2 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1b365d]">{t('officerHeader')}</h2>
          <p className="text-xs text-slate-600">{t('officerSub')}</p>
        </div>
        {data && <span className="text-xs bg-slate-800 text-white px-2.5 py-0.5 rounded font-mono">{data.officerId}</span>}
      </div>

      {!data ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-300 p-3 rounded">
              <span className="text-xs text-slate-500 font-semibold">{s.label}</span>
              <h3 className={`text-xl font-bold ${s.color}`}>{s.value}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
