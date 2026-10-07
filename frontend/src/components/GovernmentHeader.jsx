import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AccessibilityControls from './AccessibilityControls.jsx';

const NAV_ITEMS = [
  { to: '/', key: 'home', end: true },
  { to: '/schemes', key: 'schemes' },
  { to: '/eligibility', key: 'eligibility' },
  { to: '/grievances', key: 'grievances' },
  { to: '/profile', key: 'profile' },
  { to: '/officer', key: 'officer' },
];

export default function GovernmentHeader({ fontSize, setFontSize, language, setLanguage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const t = (key) => getTranslation(language, key);

  const go = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-50">
      {/* Sleek Top Utility Strip */}
      <div className="bg-[#1b365d] text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="font-semibold tracking-wide text-amber-300">{t('govOfIndia')}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-200 text-[11px] hidden sm:inline">{t('helpline')}</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <AccessibilityControls fontSize={fontSize} setFontSize={setFontSize} language={language} />
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5" aria-label="SAHAYAK home">
          <div className="w-9 h-9 bg-[#1b365d] rounded flex items-center justify-center text-amber-400 font-bold shadow-xs">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-5.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14c-2.7 0-5.2-1.6-6.4-4.1C7.1 14.2 9.5 13 12 13s4.9 1.2 6.4 2.9c-1.2 2.5-3.7 4.1-6.4 4.1z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-[#1b365d] tracking-tight">SAHAYAK</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold border border-emerald-300 uppercase">
                {language === 'hi' ? 'आधिकारिक' : 'Official'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">{t('portalSub')}</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-slate-700" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-colors ${isActive ? 'bg-[#1b365d] text-white font-semibold' : 'hover:bg-slate-100 text-slate-800'}`
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        {/* Primary Action Button */}
        <div className="flex items-center space-x-2">
          <Link to="/assistant" className="bg-[#1b365d] hover:bg-[#122440] text-amber-300 hover:text-white border border-amber-500/40 font-semibold px-3.5 py-1.5 rounded text-xs sm:text-sm flex items-center space-x-1.5 shadow-xs transition-all">
            <span className="text-base animate-pulse" aria-hidden="true">🎙️</span>
            <span>{t('talkToSahayak')}</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-1.5 rounded text-slate-700 hover:bg-slate-100 border border-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-slate-50 border-t border-slate-200 px-4 py-3 space-y-1.5 text-sm font-medium" aria-label="Mobile navigation">
          <button onClick={() => go('/')} className="block w-full text-left px-3 py-2 rounded hover:bg-slate-200">{t('home')}</button>
          <button onClick={() => go('/assistant')} className="block w-full text-left px-3 py-2 rounded bg-amber-100 text-amber-900 font-bold">🎙️ {t('talkToSahayak')}</button>
          {NAV_ITEMS.filter((i) => i.key !== 'home').map((item) => (
            <button key={item.to} onClick={() => go(item.to)} className="block w-full text-left px-3 py-2 rounded hover:bg-slate-200">{t(item.key)}</button>
          ))}
        </nav>
      )}
    </header>
  );
}
