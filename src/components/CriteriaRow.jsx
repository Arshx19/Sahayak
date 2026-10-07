// A small "label: value" pair used for extracted parameters / criteria.
export default function CriteriaRow({ label, value }) {
  return (
    <div>
      <span className="text-slate-500">{label}:</span>{' '}
      <strong className="block text-slate-800">{value}</strong>
    </div>
  );
}
