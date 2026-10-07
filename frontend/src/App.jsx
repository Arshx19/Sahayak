import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GovernmentHeader from './components/GovernmentHeader.jsx';
import Footer from './components/Footer.jsx';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SchemesPage from './pages/SchemesPage.jsx';
import SchemeDetailPage from './pages/SchemeDetailPage.jsx';
import CitizenDashboardPage from './pages/CitizenDashboardPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

export default function App() {
  const [fontSize, setFontSize] = useState('base');
  const [language, setLanguage] = useState('en');

  const fontClass = fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <AuthProvider>
      <NotificationProvider>
        <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans ${fontClass}`}>
          <GovernmentHeader
            fontSize={fontSize}
            setFontSize={setFontSize}
            language={language}
            setLanguage={setLanguage}
          />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage language={language} />} />
              <Route path="/login" element={<LoginPage language={language} />} />
              <Route path="/schemes" element={<SchemesPage language={language} />} />
              <Route path="/schemes/:schemeId" element={<SchemeDetailPage language={language} />} />

              {/* Citizen Workflow Routes */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute>
                    <CitizenDashboardPage language={language} />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Navigate to="/citizen" replace />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage language={language} />
                  </ProtectedRoute>
                }
              />

              {/* Admin Workflow Route (Admin Protected) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles="admin">
                    <AdminDashboardPage language={language} />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer language={language} />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}
