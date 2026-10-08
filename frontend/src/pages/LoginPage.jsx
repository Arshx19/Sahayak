import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getTranslation } from '../utils/translations.js';
import {
  Landmark,
  User,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Loader2,
  MapPin,
  LogOut,
  ArrowRight,
} from 'lucide-react';

const INDIAN_STATES = [
  'Maharashtra',
  'Uttar Pradesh',
  'Karnataka',
  'Odisha',
  'Bihar',
  'Rajasthan',
  'Madhya Pradesh',
  'West Bengal',
  'Gujarat',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'Punjab',
  'Haryana',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Delhi (NCT)',
  'Jammu & Kashmir',
  'Goa',
  'All States / Central',
];

export default function LoginPage({ language }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('');
  const [localError, setLocalError] = useState('');

  const { user, isAuthenticated, logout, login, register, loading, authError, setAuthError } = useAuth();
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
      const res = await register({
        name,
        email,
        password,
        phone,
        role,
        state,
        district,
      });
      if (res && res.success) {
        redirectAfterAuth(res.user?.role || role);
      }
    } else {
      const res = await login(email, password);
      if (res && res.success) {
        redirectAfterAuth(res.user?.role || 'citizen');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-6 sm:p-8 rounded-lg border border-slate-300 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#0f2942] text-amber-400 rounded-md flex items-center justify-center mx-auto shadow-xs border border-slate-700">
            <Landmark className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2942]">
            {isRegister ? 'Portal Registration' : 'Government Services Login'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Create an account by specifying your role, location, and credentials'
              : 'Sign in to access your citizen profile, scheme eligibility, or official dashboard'}
          </p>
        </div>

        {/* Existing Active Session Alert */}
        {isAuthenticated && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3 rounded-md text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
            <div>
              <span className="font-bold">Currently Signed In:</span>{' '}
              <span>
                {user?.name || user?.email} (
                <strong className="capitalize">{user?.role}</strong>
                {user?.state ? `, ${user.state}` : ''})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => logout()}
                className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 px-2 py-1 rounded font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
              <Link
                to={user?.role === 'admin' ? '/admin' : user?.role === 'officer' ? '/officer' : '/citizen'}
                className="bg-[#0f2942] text-white px-2 py-1 rounded font-semibold text-[11px] inline-flex items-center gap-1"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-3.5 py-2.5 rounded text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{localError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* REGISTRATION SPECIFIC FIELDS */}
          {isRegister && (
            <>
              {/* Role Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Account Role / Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`p-2 rounded border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      role === 'citizen'
                        ? 'border-[#0f2942] bg-slate-100/80 text-[#0f2942] font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-[11px]">Citizen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('officer')}
                    className={`p-2 rounded border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      role === 'officer'
                        ? 'border-[#0f2942] bg-slate-100/80 text-[#0f2942] font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="text-[11px]">Officer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-2 rounded border text-left transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      role === 'admin'
                        ? 'border-[#0f2942] bg-slate-100/80 text-[#0f2942] font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px]">Admin</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {role === 'citizen' && 'Access scheme matching, upload documents, and file grievances.'}
                  {role === 'officer' && 'Review citizen entitlement claims and manage grievances.'}
                  {role === 'admin' && 'Access policy console, gazette new schemes, and inspect audit logs.'}
                </p>
              </div>

              {/* Location Fields: State & District */}
              <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-md space-y-2.5">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  <span>Citizen Location / Jurisdiction</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      State / Union Territory <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2942] bg-white font-medium"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      District / City
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Satara / Lucknow / Pune"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2942] bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  State determines eligibility for state-funded schemes (UP, Maharashtra, Karnataka, Odisha, etc.).
                </p>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rameshwar Patil"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#0f2942]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#0f2942]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email & Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@sahayak.gov.in"
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#0f2942]"
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
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#0f2942]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f2942] hover:bg-[#1a3b5c] text-white font-semibold py-2.5 rounded text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer capitalize"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            <span>
              {isRegister
                ? `Create ${role} Account (${state})`
                : 'Sign In to Portal'}
            </span>
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
                className="font-bold text-[#0f2942] hover:underline cursor-pointer"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              New user?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setLocalError('');
                  setAuthError(null);
                }}
                className="font-bold text-[#0f2942] hover:underline cursor-pointer"
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
