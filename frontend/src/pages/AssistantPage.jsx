import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import VoiceButton from '../components/VoiceButton.jsx';
import CriteriaRow from '../components/CriteriaRow.jsx';
import { ArrowRight, RotateCcw } from 'lucide-react';

export default function AssistantPage({ language }) {
  // voiceState: IDLE -> LISTENING -> PROCESSING -> RESULT
  const [voiceState, setVoiceState] = useState('IDLE');
  const [textInput, setTextInput] = useState('');
  const timers = useRef([]);
  const navigate = useNavigate();
  const hi = language === 'hi';
  const t = (key) => getTranslation(language, key);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleStartListening = () => {
    timers.current.forEach(clearTimeout);
    setVoiceState('LISTENING');
    timers.current = [
      setTimeout(() => setVoiceState('PROCESSING'), 2500),
      setTimeout(() => setVoiceState('RESULT'), 4000),
    ];
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b border-slate-300 pb-2">
        <h2 className="text-xl font-bold text-[#0f2942]">{t('assistantTitle')}</h2>
        <p className="text-xs text-slate-600">{t('assistantSub')}</p>
      </div>

      <div className="bg-white border border-slate-300 rounded p-6 text-center space-y-6 shadow-2xs">
        {voiceState === 'IDLE' && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-800">{t('howHelp')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{t('tapToSpeak')}</p>

            <VoiceButton state="IDLE" onClick={handleStartListening} label={t('speakBtn')} />

            <div className="text-xs text-slate-500">
              {hi ? 'भाषा:' : 'Language:'} <strong className="text-slate-800">हिंदी / English (Auto Detect)</strong>
            </div>
          </div>
        )}

        {voiceState === 'LISTENING' && (
          <div className="space-y-4 py-2">
            <VoiceButton state="LISTENING" />
            <div>
              <h4 className="text-base font-bold text-rose-700">{t('listening')}</h4>
              <p className="text-xs text-slate-600">{t('pleaseSpeak')}</p>
            </div>

            <div className="flex items-center justify-center space-x-1 h-6" aria-hidden="true">
              {[40, 80, 30, 90, 60, 100, 50, 70].map((h, i) => (
                <div key={i} className="w-1 bg-rose-500 rounded-full animate-bounce" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
        )}

        {voiceState === 'PROCESSING' && (
          <div className="space-y-4 py-4">
            <VoiceButton state="PROCESSING" />
            <div>
              <h4 className="text-sm font-bold text-[#0f2942]">{t('processing')}</h4>
              <p className="text-xs text-slate-500">{t('transcribing')}</p>
            </div>
          </div>
        )}

        {voiceState === 'RESULT' && (
          <div className="text-left space-y-4">
            {/* Transcript */}
            <div className="bg-slate-50 border border-slate-300 p-3 rounded space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">{t('transcriptionTitle')}</span>
              <p className="text-xs font-semibold text-slate-800 italic">{t('sampleTranscript')}</p>
            </div>

            {/* Extracted Parameters */}
            <div className="border border-slate-300 rounded p-3 space-y-2 bg-white">
              <h4 className="text-[11px] font-bold text-[#0f2942] uppercase tracking-wider border-b border-slate-200 pb-1">{t('extractedParams')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <CriteriaRow label={t('age')} value={`62 ${hi ? 'वर्ष' : 'Years'}`} />
                <CriteriaRow label={t('occupation')} value={hi ? 'किसान' : 'Farmer'} />
                <CriteriaRow label={t('income')} value={`₹1,80,000 / ${hi ? 'वर्ष' : 'yr'}`} />
                <CriteriaRow label={t('state')} value={hi ? 'उत्तराखंड' : 'Uttarakhand'} />
              </div>
            </div>

            {/* Matched Scheme Recommendation */}
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800">{t('matchFound')}</span>
                <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded font-bold">{t('eligibleBadge')}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">
                {hi ? 'पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)' : 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)'}
              </h4>
              <p className="text-xs text-slate-700">
                {hi ? 'प्रति वर्ष ₹6,000 की आय सहायता की सभी शर्तें पूरी होती हैं।' : 'Satisfies criteria for ₹6,000/year income support.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/schemes/CEN001')}
                  className="bg-[#0f2942] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1a3b5c] inline-flex items-center gap-1.5"
                >
                  <span>{t('viewSchemeDocs')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setVoiceState('IDLE')}
                  className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('askAnother')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text Fallback Input */}
        <div className="pt-3 border-t border-slate-200 text-left space-y-1.5">
          <label htmlFor="assistant-query" className="text-xs font-bold text-slate-700">{t('typeQuery')}</label>
          <div className="flex gap-2">
            <input
              id="assistant-query"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('typePlaceholder')}
              className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#0f2942]"
            />
            <button onClick={handleStartListening} className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-900 cursor-pointer">
              {t('submitBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
