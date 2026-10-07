import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AccessibilityControls from './AccessibilityControls.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function GovernmentHeader({ fontSize, setFontSize, language, setLanguage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const t = (key) => getTranslation(language, key);

  const go = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // Clean Navigation reflecting the new document-centric workflow
  const getNavItems = () => {
    const base = [
      { to: '/', label: 'Home', end: true },
      { to: '/schemes', label: 'Government Schemes' },
    ];

    if (!isAuthenticated || user?.role === 'citizen') {
      return [
        ...base,
        { to: '/citizen', label: 'My Dashboard & Documents' },
        { to: '/profile', label: 'Demographic Profile' },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...base,
        { to: '/admin', label: 'Admin Scheme Control' },
      ];
    }

    return base;
  };

  const navItems = getNavItems();

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
          Admin
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
        Citizen
      </span>
    );
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-50">
      {/* Top Utility Strip (Helpline removed) */}
      <div className="bg-[#1b365d] text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="font-semibold tracking-wide text-amber-300">{t('govOfIndia')}</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 text-[11px] hidden sm:inline">
            National Public Welfare Schemes & Eligibility Portal
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <AccessibilityControls fontSize={fontSize} setFontSize={setFontSize} language={language} />
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0" aria-label="SAHAYAK home">
          <div className="w-9 h-9 bg-[#1b365d] rounded flex items-center justify-center text-amber-400 font-bold shadow-xs">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-5.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14c-2.7 0-5.2-1.6-6.4-4.1C7.1 14.2 9.5 13 12 13s4.9 1.2 6.4 2.9c-1.2 2.5-3.7 4.1-6.4 4.1z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-[#1b365d] tracking-tight">SAHAYAK</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold border border-emerald-300 uppercase">
                Official
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Government Scheme Eligibility & Document Locker
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 font-medium text-xs sm:text-sm text-slate-700">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-colors ${
                  isActive
                    ? 'bg-[#1b365d] text-white font-semibold'
                    : 'hover:bg-slate-100 text-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Section: Notification Bell + Auth */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Real-time Scheme Notification Bell */}
          <NotificationBell />

          {/* User Auth Info & Logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                to={user?.role === 'admin' ? '/admin' : '/citizen'}
                className="hidden md:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition text-xs"
              >
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {user?.name?.split(' ')[0]}
                </span>
                {getRoleBadge(user?.role)}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-700 hover:text-rose-900 font-bold px-2 py-1 hover:bg-rose-50 rounded border border-rose-200 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded text-xs transition shadow-2xs"
            >
              Sign In / Register
            </Link>
          )}

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
        <nav className="lg:hidden bg-slate-50 border-t border-slate-200 px-4 py-3 space-y-1.5 text-xs font-medium">
          {isAuthenticated && (
            <div className="p-2.5 mb-2 bg-white rounded border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-[10px] text-slate-500">{user?.email}</p>
              </div>
              {getRoleBadge(user?.role)}
            </div>
          )}

          {navItems.map((item) => (
            <button
              key={item.to}
              onClick={() => go(item.to)}
              className="block w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-slate-800"
            >
              {item.label}
            </button>
          ))}

          <div className="pt-2 border-t border-slate-200">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded text-rose-700 hover:bg-rose-50 font-bold"
              >
                Sign Out ({user?.email})
              </button>
            ) : (
              <button
                onClick={() => go('/login')}
                className="w-full text-left px-3 py-2 rounded bg-emerald-700 text-white font-bold"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
