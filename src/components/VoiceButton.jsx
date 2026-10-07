// state: 'IDLE' | 'LISTENING' | 'PROCESSING'
export default function VoiceButton({ state = 'IDLE', onClick, label }) {
  if (state === 'LISTENING') {
    return (
      <div role="status" aria-live="polite" className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto animate-pulse border-4 border-rose-300 shadow-lg">
        <span className="text-2xl" aria-hidden="true">🔴</span>
      </div>
    );
  }

  if (state === 'PROCESSING') {
    return (
      <div role="status" aria-live="polite" aria-label="Processing" className="w-12 h-12 border-4 border-[#1b365d] border-t-amber-500 rounded-full animate-spin mx-auto"></div>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-20 h-20 rounded-full bg-[#1b365d] hover:bg-[#122440] text-white flex flex-col items-center justify-center mx-auto shadow-md border-4 border-amber-400 transition-transform active:scale-95 cursor-pointer"
    >
      <span className="text-2xl" aria-hidden="true">🎙️</span>
      <span className="text-[9px] font-bold text-amber-300 mt-0.5">{label}</span>
    </button>
  );
}
