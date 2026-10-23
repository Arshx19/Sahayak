const STYLES = {
  OPEN: 'bg-blue-50 text-blue-800 border-blue-200',
  ASSIGNED: 'bg-purple-50 text-purple-800 border-purple-200',
  'IN PROGRESS': 'bg-amber-50 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CLOSED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  PENDING: 'bg-orange-50 text-orange-800 border-orange-200',
};

export default function StatusBadge({ status = 'OPEN' }) {
  const norm = String(status || 'OPEN').toUpperCase();
  const display = norm.replace(/_/g, ' ');
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block whitespace-nowrap ${STYLES[norm] || STYLES.OPEN}`}>
      {display}
    </span>
  );
}
