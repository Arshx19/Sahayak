import { Link } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import ServiceCard from '../components/ServiceCard.jsx';

export default function HomePage({ language }) {
  const t = (key) => getTranslation(language, key);

  return (
    <div className="space-y-8 pb-12">
      {/* Official Banner */}
      <section className="bg-gradient-to-b from-slate-100 to-slate-200/60 border-b border-slate-300 py-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 px-3 py-0.5 rounded-full text-xs font-semibold">
            <span aria-hidden="true">🇮🇳</span>
            <span>{t('initiative')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b365d] tracking-tight leading-snug">{t('heroTitle')}</h2>
          <p className="text-slate-700 text-xs sm:text-sm max-w-2xl mx-auto">{t('heroSub')}</p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/assistant" className="w-full sm:w-auto bg-[#1b365d] hover:bg-[#122440] text-amber-300 font-bold px-6 py-2.5 rounded text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-2 border border-amber-500/40">
              <span className="text-base" aria-hidden="true">🎙️</span>
              <span>{t('talkToSahayak')}</span>
            </Link>
            <Link to="/schemes" className="w-full sm:w-auto text-center bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-2.5 rounded text-xs sm:text-sm border border-slate-300 shadow-2xs">
              {t('browseSchemes')}
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="border-b border-slate-300 pb-2">
          <h3 className="text-lg font-bold text-[#1b365d]">{t('citizenServices')}</h3>
          <p className="text-xs text-slate-600">{t('selectService')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceCard to="/assistant" icon="🎙️" iconClass="bg-amber-100 text-amber-800" title={t('talkTitle')} description={t('talkDesc')} />
          <ServiceCard to="/schemes" icon="📋" iconClass="bg-blue-100 text-blue-800" title={t('findTitle')} description={t('findDesc')} />
          <ServiceCard to="/profile" icon="👤" iconClass="bg-emerald-100 text-emerald-800" title={t('profileTitle')} description={t('profileDesc')} />
          <ServiceCard to="/grievances" icon="🚨" iconClass="bg-rose-100 text-rose-800" title={t('grievanceTitle')} description={t('grievanceDesc')} />
        </div>
      </section>

      {/* How SAHAYAK Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="border-b border-slate-300 pb-2">
          <h3 className="text-lg font-bold text-[#1b365d]">{t('howItWorks')}</h3>
          <p className="text-xs text-slate-600">{t('howItWorksSub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { step: '01', title: t('step1Title'), desc: t('step1Desc') },
            { step: '02', title: t('step2Title'), desc: t('step2Desc') },
            { step: '03', title: t('step3Title'), desc: t('step3Desc') },
            { step: '04', title: t('step4Title'), desc: t('step4Desc') },
            { step: '05', title: t('step5Title'), desc: t('step5Desc') },
          ].map((item) => (
            <div key={item.step} className="bg-slate-50 border border-slate-300 p-3.5 rounded space-y-1.5">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">
                {language === 'hi' ? `चरण ${item.step}` : `Step ${item.step}`}
              </span>
              <h5 className="font-bold text-slate-900 text-xs">{item.title}</h5>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
