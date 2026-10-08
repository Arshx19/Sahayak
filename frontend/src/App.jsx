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
import OfficerDashboardPage from './pages/OfficerDashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import GrievancesPage from './pages/GrievancesPage.jsx';
import GrievanceDetailPage from './pages/GrievanceDetailPage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';

export default function App() {
  const [fontSize, setFontSize] = useState('base');
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('sahayak_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('sahayak_language', lang);
    } catch {}
  };

  const fontClass = fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <AuthProvider>
      <NotificationProvider>
        <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans ${fontClass}`}>
          <GovernmentHeader
            fontSize={fontSize}
            setFontSize={setFontSize}
            language={language}
            setLanguage={handleSetLanguage}
          />

          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage language={language} />} />
              <Route path="/login" element={<LoginPage language={language} />} />
              <Route path="/schemes" element={<SchemesPage language={language} />} />
              <Route path="/schemes/:schemeId" element={<SchemeDetailPage language={language} />} />
              <Route path="/assistant" element={<AssistantPage language={language} />} />

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
              <Route
                path="/grievances"
                element={
                  <ProtectedRoute>
                    <GrievancesPage language={language} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievances/:grievanceId"
                element={
                  <ProtectedRoute>
                    <GrievanceDetailPage language={language} />
                  </ProtectedRoute>
                }
              />

              {/* Nodal Officer Portal Route */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <OfficerDashboardPage language={language} />
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
