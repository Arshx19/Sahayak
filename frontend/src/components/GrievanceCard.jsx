import { getTranslation } from '../utils/translations.js';
import StatusBadge from './StatusBadge.jsx';

export default function GrievanceCard({ grievance: item, language, onView }) {
  const t = (key) => getTranslation(language, key);
  const hi = language === 'hi';

  return (
    <div className="bg-white border border-slate-300 rounded p-4 space-y-2 shadow-2xs">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
            {t('ticketNo')}{item.id}
          </span>
          <h3 className="font-bold text-slate-900 text-xs mt-1">{hi ? item.hiSubject : item.subject}</h3>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <p className="text-xs text-slate-600">{hi ? item.hiDescription : item.description}</p>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>{t('department')} <strong className="text-slate-800">{hi ? item.hiDepartment : item.department}</strong></span>
        <button onClick={() => onView(item.id)} className="font-bold text-[#0f2942] hover:underline cursor-pointer">
          {t('trackStatus')}
        </button>
      </div>
    </div>
  );
}
