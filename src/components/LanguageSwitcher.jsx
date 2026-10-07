export default function LanguageSwitcher({ language, setLanguage }) {
  return (
    <div className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700" role="group" aria-label="Language selection">
      <button onClick={() => setLanguage('hi')} aria-pressed={language === 'hi'} className={`px-1.5 py-0.5 rounded ${language === 'hi' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300 hover:text-white'}`}>हिंदी</button>
      <span className="text-slate-600" aria-hidden="true">|</span>
      <button onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300 hover:text-white'}`}>English</button>
    </div>
  );
}
