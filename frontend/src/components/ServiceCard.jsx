import { Link } from 'react-router-dom';

export default function ServiceCard({ to, icon, iconClass, title, description }) {
  return (
    <Link to={to} className="block bg-white p-4 rounded border border-slate-300 shadow-2xs hover:border-[#0f2942] hover:shadow-md transition-all group">
      <div className={`w-9 h-9 rounded flex items-center justify-center text-lg font-bold mb-2 ${iconClass}`} aria-hidden="true">{icon}</div>
      <h4 className="font-bold text-slate-900 group-hover:text-[#0f2942] text-sm">{title}</h4>
      <p className="text-xs text-slate-600 mt-1">{description}</p>
    </Link>
  );
}
