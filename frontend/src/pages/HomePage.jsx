import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage({ language }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-10 pb-16">
      {/* Official Government Hero Banner */}
      <section className="bg-gradient-to-b from-slate-100 to-slate-200/60 border-b border-slate-300 py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 px-3 py-0.5 rounded-full text-xs font-semibold">
            <span>🇮🇳</span>
            <span>Government of India • Citizen Entitlement Initiative</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1b365d] tracking-tight leading-snug">
            Discover Government Schemes You Qualify For Based on Your Documents
          </h1>
          <p className="text-slate-700 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            Upload your verification documents to your secure locker. SAHAYAK automatically matches you with Central and State schemes, clearly shows why you cannot apply yet, and notifies you the moment you become eligible.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/citizen' : '/login'}
              className="w-full sm:w-auto bg-[#1b365d] hover:bg-[#122440] text-white font-bold px-7 py-3 rounded text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition"
            >
              <span>🗂️</span>
              <span>{isAuthenticated ? 'Go to My Document Dashboard' : 'Sign In / Register as Citizen'}</span>
            </Link>
            <Link
              to="/schemes"
              className="w-full sm:w-auto text-center bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3 rounded text-xs sm:text-sm border border-slate-300 shadow-2xs transition"
            >
              Browse All Government Schemes →
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Core User Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#1b365d]">How SAHAYAK Works</h2>
          <p className="text-xs text-slate-600">
            A transparent, deterministic eligibility verification journey with zero guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-300 p-5 rounded-lg space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-blue-100 text-[#1b365d] rounded-lg flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Upload Your Documents</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add your Aadhaar Card, PAN Card, Land Records, or Income Certificate to your digital document locker. Each file is verified instantly.
            </p>
          </div>

          <div className="bg-white border border-slate-300 p-5 rounded-lg space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-amber-100 text-amber-900 rounded-lg flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Deterministic Eligibility</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The platform compares your verified documents and demographics with Central and State rules. If you cannot apply, you see exact visual reasons (e.g. Land Records missing ✕).
            </p>
          </div>

          <div className="bg-white border border-slate-300 p-5 rounded-lg space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-center text-xl font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Real-Time Notifications</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Whenever you upload a required document or an administrator opens a new welfare program, you receive instant alerts on eligible benefits.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Call to Action */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#1b365d] to-[#2b4c7e] text-white rounded-lg p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Ready to Verify Your Scheme Entitlements?
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
            Log in to manage your documents and get personalized eligibility for PM-KISAN, PMAY Housing, Ayushman Bharat, and State welfare schemes.
          </p>
          <div className="pt-2">
            <Link
              to={isAuthenticated ? '/citizen' : '/login'}
              className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-2.5 rounded text-xs shadow-xs transition"
            >
              Open Citizen Dashboard →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
