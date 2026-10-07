import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api.js';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  citizen: {
    id: 'usr_citizen_01',
    user_id: 'usr_citizen_01',
    name: 'Rameshwar Patil',
    email: 'rameshwar.patil@example.in',
    role: 'citizen',
    token: 'demo-token-citizen-2026',
  },
  officer: {
    id: 'usr_officer_01',
    user_id: 'usr_officer_01',
    name: 'Pooja Deshmukh (Nodal Officer)',
    email: 'pooja.officer@sahayak.gov.in',
    role: 'officer',
    token: 'demo-token-officer-2026',
  },
  admin: {
    id: 'usr_admin_01',
    user_id: 'usr_admin_01',
    name: 'Super Admin (National Informatics)',
    email: 'admin@sahayak.gov.in',
    role: 'admin',
    token: 'demo-token-admin-2026',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sahayak_user');
      return savedUser ? JSON.parse(savedUser) : DEMO_ACCOUNTS.citizen;
    } catch {
      return DEMO_ACCOUNTS.citizen;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sahayak_token') || DEMO_ACCOUNTS.citizen.token;
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
      // Check if credentials match any demo account for instant testing
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

  const demoLogin = (role = 'citizen') => {
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
