import { Mic, Radio, Loader2 } from 'lucide-react';

// state: 'IDLE' | 'LISTENING' | 'PROCESSING'
export default function VoiceButton({ state = 'IDLE', onClick, label }) {
  if (state === 'LISTENING') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto border-4 border-rose-200 shadow-md animate-pulse"
      >
        <Radio className="w-7 h-7 text-white" aria-hidden="true" />
      </div>
    );
  }

  if (state === 'PROCESSING') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Processing"
        className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center mx-auto"
      >
        <Loader2 className="w-6 h-6 text-[#0f2942] animate-spin" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-16 h-16 rounded-full bg-[#0f2942] hover:bg-[#1a3b5c] text-white flex flex-col items-center justify-center mx-auto shadow-md border-2 border-amber-400 transition-transform active:scale-95 cursor-pointer"
    >
      <Mic className="w-6 h-6 text-white" aria-hidden="true" />
      {label && <span className="text-[9px] font-bold text-amber-300 mt-0.5">{label}</span>}
    </button>
  );
}
