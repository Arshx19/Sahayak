import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import GovernmentHeader from './components/GovernmentHeader.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';
import SchemesPage from './pages/SchemesPage.jsx';
import SchemeDetailPage from './pages/SchemeDetailPage.jsx';
import EligibilityPage from './pages/EligibilityPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import GrievancesPage from './pages/GrievancesPage.jsx';
import GrievanceDetailPage from './pages/GrievanceDetailPage.jsx';
import OfficerDashboardPage from './pages/OfficerDashboardPage.jsx';

export default function App() {
  const [fontSize, setFontSize] = useState('base');
  const [language, setLanguage] = useState('en');

  const fontClass = fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans ${fontClass}`}>
      <GovernmentHeader fontSize={fontSize} setFontSize={setFontSize} language={language} setLanguage={setLanguage} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage language={language} />} />
          <Route path="/assistant" element={<AssistantPage language={language} />} />
          <Route path="/schemes" element={<SchemesPage language={language} />} />
          <Route path="/schemes/:schemeId" element={<SchemeDetailPage language={language} />} />
          <Route path="/eligibility" element={<EligibilityPage language={language} />} />
          <Route path="/profile" element={<ProfilePage language={language} />} />
          <Route path="/grievances" element={<GrievancesPage language={language} />} />
          <Route path="/grievances/:grievanceId" element={<GrievanceDetailPage language={language} />} />
          <Route path="/officer" element={<OfficerDashboardPage language={language} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer language={language} />
    </div>
  );
}
