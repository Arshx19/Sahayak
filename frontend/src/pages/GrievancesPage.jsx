import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import { getGrievances } from '../services/api.js';
import GrievanceCard from '../components/GrievanceCard.jsx';
import LoadingState from '../components/LoadingState.jsx';

export default function GrievancesPage({ language }) {
  const [grievances, setGrievances] = useState(null);
  const navigate = useNavigate();
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    getGrievances().then(setGrievances);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="border-b border-slate-300 pb-2 flex justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1b365d]">{t('grievancesHeader')}</h2>
          <p className="text-xs text-slate-600">{t('grievancesHeaderSub')}</p>
        </div>
        <button className="bg-rose-700 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-rose-800 shrink-0">
          {t('newGrievance')}
        </button>
      </div>

      {!grievances ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {grievances.map((item) => (
            <GrievanceCard key={item.id} grievance={item} language={language} onView={(id) => navigate(`/grievances/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
