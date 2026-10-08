import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api.js';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  citizen: {
    id: 'usr_citizen_01',
    user_id: 'usr_citizen_01',
    name: 'Rameshwar Patil',
    email: 'citizen@sahayak.gov.in',
    role: 'citizen',
    state: 'Maharashtra',
    district: 'Satara',
    token: 'demo-token-citizen-2026',
  },
  officer: {
    id: 'usr_officer_01',
    user_id: 'usr_officer_01',
    name: 'Pooja Deshmukh (Nodal Officer)',
    email: 'officer@sahayak.gov.in',
    role: 'officer',
    state: 'Maharashtra',
    district: 'Pune',
    token: 'demo-token-officer-2026',
  },
  admin: {
    id: 'usr_admin_01',
    user_id: 'usr_admin_01',
    name: 'Super Admin (National Informatics)',
    email: 'admin@sahayak.gov.in',
    role: 'admin',
    state: 'All States / UTs',
    district: 'New Delhi',
    token: 'demo-token-admin-2026',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sahayak_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sahayak_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('sahayak_user', JSON.stringify(user));
      localStorage.setItem('sahayak_token', token);
    } else {
      localStorage.removeItem('sahayak_user');
      localStorage.removeItem('sahayak_token');
    }
  }, [user, token]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await loginUser({ email, password });
      if (res && res.success && res.data) {
        const u = res.data.user;
        const t = res.data.access_token;
        setUser(u);
        setToken(t);
        setLoading(false);
        return { success: true, user: u };
      }
      throw new Error(res?.error || 'Authentication failed');
    } catch (err) {
      // 1. Check local registered users list in offline mode
      try {
        const registered = JSON.parse(localStorage.getItem('sahayak_registered_users') || '[]');
        const match = registered.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (match) {
          const { password: _, ...userWithoutPass } = match;
          setUser(userWithoutPass);
          setToken(userWithoutPass.token);
          setLoading(false);
          return { success: true, user: userWithoutPass };
        }
      } catch {}

      // 2. Check demo accounts for quick testing
      const lower = email.toLowerCase();
      if (lower.includes('admin')) {
        const u = DEMO_ACCOUNTS.admin;
        setUser(u);
        setToken(u.token);
        setLoading(false);
        return { success: true, user: u };
      } else if (lower.includes('officer')) {
        const u = DEMO_ACCOUNTS.officer;
        setUser(u);
        setToken(u.token);
        setLoading(false);
        return { success: true, user: u };
      } else if (lower.includes('citizen') || lower.includes('patil')) {
        const u = DEMO_ACCOUNTS.citizen;
        setUser(u);
        setToken(u.token);
        setLoading(false);
        return { success: true, user: u };
      }

      setAuthError(err.message || 'Invalid email or password');
      setLoading(false);
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  };

  const demoLogin = async (role = 'citizen') => {
    const creds = {
      citizen: { email: 'citizen@sahayak.gov.in', password: 'Citizen@123' },
      officer: { email: 'officer@sahayak.gov.in', password: 'Officer@123' },
      admin: { email: 'admin@sahayak.gov.in', password: 'Admin@123' },
    }[role] || { email: 'citizen@sahayak.gov.in', password: 'Citizen@123' };

    try {
      const res = await login(creds.email, creds.password);
      if (res && res.success) return res.user;
    } catch {
      // Fallback to offline demo account
    }

    const acc = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.citizen;
    setUser(acc);
    setToken(acc.token);
    setAuthError(null);
    return acc;
  };

  const register = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await registerUser(userData);
      if (res && res.success) {
        // Auto-login after registration
        return await login(userData.email, userData.password);
      }
      throw new Error(res?.error || 'Registration failed');
    } catch (err) {
      // If network fails (e.g. backend server is offline or unreachable), register locally in offline mode!
      const isNetworkError =
        !err.response &&
        (err.message === 'Failed to fetch' ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('fetch') ||
          err.message?.includes('network'));

      if (isNetworkError) {
        const localUser = {
          id: `usr_${Date.now()}`,
          user_id: `usr_${Date.now()}`,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role || 'citizen',
          state: userData.state || 'Maharashtra',
          district: userData.district || '',
          token: `offline-token-${Date.now()}`,
        };

        // Save into local registered users list so they can log back in
        try {
          const registered = JSON.parse(localStorage.getItem('sahayak_registered_users') || '[]');
          registered.push({ ...localUser, password: userData.password });
          localStorage.setItem('sahayak_registered_users', JSON.stringify(registered));
        } catch {}

        // Save session
        setUser(localUser);
        setToken(localUser.token);
        localStorage.setItem('sahayak_user', JSON.stringify(localUser));
        localStorage.setItem('sahayak_token', localUser.token);

        // Save profile
        const localProfile = {
          name: localUser.name,
          phone: localUser.phone,
          email: localUser.email,
          state: localUser.state,
          district: localUser.district,
          occupation: '',
          annual_income: 0,
          age: 0,
        };
        localStorage.setItem('sahayak_profile', JSON.stringify(localProfile));

        setLoading(false);
        return { success: true, user: localUser };
      }

      setAuthError(err.message || 'Registration failed');
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sahayak_user');
    localStorage.removeItem('sahayak_token');
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        authError,
        setAuthError,
        login,
        demoLogin,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
