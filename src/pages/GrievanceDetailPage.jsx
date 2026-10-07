import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import { getGrievanceById, getGrievances } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import GrievanceTimeline from '../components/GrievanceTimeline.jsx';
import LoadingState from '../components/LoadingState.jsx';

export default function GrievanceDetailPage({ language }) {
  const { grievanceId } = useParams();
  const [g, setG] = useState(null);
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    setG(null);
    (async () => {
      // Original behaviour: unknown id falls back to the first grievance.
      const found = await getGrievanceById(grievanceId);
      setG(found || (await getGrievances())[0]);
    })();
  }, [grievanceId]);

  if (!g) return <LoadingState />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <Link to="/grievances" className="text-xs font-bold text-[#1b365d] hover:underline flex items-center gap-1">
        {t('backToGrievances')}
      </Link>

      <div className="bg-white border border-slate-300 rounded p-5 space-y-4">
        <div className="flex justify-between items-start border-b border-slate-200 pb-3 gap-2">
          <div>
            <span className="text-xs font-bold text-slate-500">{t('ticketNo')}{g.id}</span>
            <h2 className="text-lg font-bold text-[#1b365d]">{language === 'hi' ? g.hiSubject : g.subject}</h2>
          </div>
          <StatusBadge status={g.status} />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#1b365d] uppercase tracking-wider">{t('timeline')}</h3>
          <GrievanceTimeline history={g.history} language={language} />
        </div>
      </div>
    </div>
  );
}
