import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getTranslation } from '../utils/translations.js';

export default function LoginPage({ language }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen');
  const [localError, setLocalError] = useState('');

  const { login, register, demoLogin, loading, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = (key) => getTranslation(language, key);

  const redirectAfterAuth = (userRole) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'admin') navigate('/admin', { replace: true });
    else if (userRole === 'officer') navigate('/officer', { replace: true });
    else navigate('/citizen', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setAuthError(null);

    if (isRegister) {
      if (!name.trim()) {
        setLocalError('Please enter your full name');
        return;
      }
      const res = await register({ name, email, password, phone, role: 'citizen' });
      if (res && res.success) {
        redirectAfterAuth(res.user?.role || 'citizen');
      }
    } else {
      const res = await login(email, password);
      if (res && res.success) {
        redirectAfterAuth(res.user?.role || 'citizen');
      }
    }
  };

  const handleQuickDemo = (roleName) => {
    const loggedUser = demoLogin(roleName);
    redirectAfterAuth(loggedUser.role);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-8 rounded-lg border border-slate-300 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#1b365d] text-amber-400 rounded-md flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
            🇮🇳
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1b365d]">
            {isRegister ? 'Citizen Registration' : 'Government Services Login'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Create a citizen account to access schemes and lodge grievances'
              : 'Sign in to access your citizen profile, scheme eligibility, or official dashboard'}
          </p>
        </div>

        {/* 1-Click Demo Profiles for Rapid Testing / Evaluators */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              ⚡ Quick Demo Login (1-Click)
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-300">
              Evaluator Mode
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('citizen')}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-1.5 rounded font-semibold transition text-center shadow-2xs"
            >
              👤 Citizen
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('officer')}
              className="bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 px-2 py-1.5 rounded font-semibold transition text-center shadow-2xs"
            >
              👮 Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 px-2 py-1.5 rounded font-semibold transition text-center shadow-2xs"
            >
              ⚙️ Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-3.5 py-2.5 rounded text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rameshwar Patil"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#1b365d]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#1b365d]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@example.in"
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#1b365d]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#1b365d]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1b365d] hover:bg-[#122440] text-white font-bold py-2.5 rounded text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading && <span className="animate-spin">⏳</span>}
            <span>{isRegister ? 'Create Citizen Account' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="pt-2 border-t border-slate-200 text-center text-xs text-slate-600">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setLocalError('');
                  setAuthError(null);
                }}
                className="font-bold text-[#1b365d] hover:underline"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              New citizen user?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setLocalError('');
                  setAuthError(null);
                }}
                className="font-bold text-[#1b365d] hover:underline"
              >
                Register for an account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
