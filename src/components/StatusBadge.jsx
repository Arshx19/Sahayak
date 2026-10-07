const STYLES = {
  'IN PROGRESS': 'bg-amber-100 text-amber-800 border-amber-300',
  RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  OPEN: 'bg-slate-100 text-slate-800 border-slate-300',
  PENDING: 'bg-rose-100 text-rose-800 border-rose-300',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STYLES[status] || STYLES.OPEN}`}>
      {status}
    </span>
  );
}
