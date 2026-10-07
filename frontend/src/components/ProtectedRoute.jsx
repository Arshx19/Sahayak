import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto border border-slate-300">
          <ShieldAlert className="w-8 h-8 text-rose-700" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          You are currently logged in as <strong className="capitalize text-slate-900">{user?.role}</strong> ({user?.email}).
          This administrative section requires <strong>{Array.isArray(allowedRoles) ? allowedRoles.join(' or ') : allowedRoles}</strong> credentials.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            to={user?.role === 'admin' ? '/admin' : user?.role === 'officer' ? '/officer' : '/citizen'}
            className="bg-[#0f2942] text-white px-5 py-2 rounded text-xs font-semibold hover:bg-[#1a3b5c] shadow-xs"
          >
            Go to My Dashboard
          </Link>
          <Link
            to="/login"
            className="bg-white border border-slate-300 text-slate-700 px-5 py-2 rounded text-xs font-semibold hover:bg-slate-50"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
