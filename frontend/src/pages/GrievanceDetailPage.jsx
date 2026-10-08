import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import { getGrievanceById } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import GrievanceTimeline from '../components/GrievanceTimeline.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { ArrowLeft } from 'lucide-react';

export default function GrievanceDetailPage({ language }) {
  const { grievanceId } = useParams();
  const [g, setG] = useState(null);
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    (async () => {
      const data = await getGrievanceById(grievanceId);
      setG(data);
    })();
  }, [grievanceId]);

  if (!g) return <LoadingState />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <Link to="/grievances" className="text-xs font-semibold text-[#0f2942] hover:underline inline-flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t('backToGrievances')}</span>
      </Link>

      <div className="bg-white border border-slate-300 rounded p-5 space-y-4">
        <div className="flex justify-between items-start border-b border-slate-200 pb-3 gap-2">
          <div>
            <span className="text-xs font-bold text-slate-500">{t('ticketNo')}{g.id}</span>
            <h2 className="text-lg font-bold text-[#0f2942]">{language === 'hi' ? g.hiSubject : g.subject}</h2>
          </div>
          <StatusBadge status={g.status} />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider">{t('timeline')}</h3>
          <GrievanceTimeline history={g.history} language={language} />
        </div>
      </div>
    </div>
  );
}
