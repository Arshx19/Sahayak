import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AccessibilityControls from './AccessibilityControls.jsx';
import NotificationBell from './NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Landmark, Shield, User, LogOut } from 'lucide-react';

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

  const getNavItems = () => {
    const base = [
      { to: '/', label: 'Home', end: true },
      { to: '/schemes', label: 'Government Schemes' },
      { to: '/grievances', label: 'Grievance Redressal' },
    ];

    if (!isAuthenticated || user?.role === 'citizen') {
      return [
        ...base,
        { to: '/citizen', label: 'Document Locker' },
        { to: '/profile', label: 'Citizen Profile' },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...base,
        { to: '/admin', label: 'Policy Administration' },
      ];
    }

    return base;
  };

  const navItems = getNavItems();

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="bg-slate-100 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
          Admin
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
        Citizen
      </span>
    );
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top Utility Strip */}
      <div className="bg-[#0f2942] text-white text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-amber-600/30">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="font-semibold tracking-wide text-amber-300">{t('govOfIndia')}</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-200 text-[11px] hidden sm:inline">
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
        <Link to="/" className="flex items-center space-x-3 shrink-0" aria-label="SAHAYAK home">
          <div className="w-9 h-9 bg-[#0f2942] rounded-md flex items-center justify-center text-amber-400 shadow-2xs">
            <Landmark className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-[#0f2942] tracking-tight">SAHAYAK</span>
              <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-semibold border border-slate-300 uppercase tracking-wider">
                Public Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Government Entitlement Verification & Document Locker
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
                    ? 'bg-[#0f2942] text-white font-semibold shadow-2xs'
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
          <NotificationBell />

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                to={user?.role === 'admin' ? '/admin' : '/citizen'}
                className="hidden md:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition text-xs"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                </span>
                {getRoleBadge(user?.role)}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold px-2.5 py-1 hover:bg-rose-50 rounded border border-rose-200 transition cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white font-semibold px-3.5 py-1.5 rounded text-xs transition shadow-2xs cursor-pointer"
            >
              Sign In / Register
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-1.5 rounded text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
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
                <p className="font-bold text-slate-900">{user?.name || user?.email}</p>
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
                className="w-full text-left px-3 py-2 rounded text-rose-700 hover:bg-rose-50 font-semibold"
              >
                Sign Out ({user?.email})
              </button>
            ) : (
              <button
                onClick={() => go('/login')}
                className="w-full text-left px-3 py-2 rounded bg-[#0f2942] text-white font-semibold"
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
