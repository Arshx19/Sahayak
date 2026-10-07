export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-[#1b365d] border-t-amber-500 rounded-full animate-spin"></div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
