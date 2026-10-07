export default function GrievanceTimeline({ history, language }) {
  const hi = language === 'hi';

  return (
    <ol className="space-y-2">
      {history.map((step, idx) => (
        <li key={idx} className="flex gap-2 text-xs">
          <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${step.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {step.done ? '✓' : idx + 1}
          </span>
          <div>
            <h4 className="font-bold text-slate-900">
              {hi ? step.hiStep : step.step} <span className="font-normal text-slate-500">({step.date})</span>
            </h4>
            <p className="text-slate-600">{hi ? step.hiDesc : step.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
