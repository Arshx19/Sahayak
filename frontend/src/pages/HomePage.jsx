import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Landmark, ArrowRight, FileText } from 'lucide-react';

export default function HomePage({ language }) {
  const { isAuthenticated } = useAuth();
  const hi = language === 'hi';

  return (
    <div className="space-y-10 pb-16">
      {/* Official Government Hero Banner */}
      <section className="bg-slate-100/90 border-b border-slate-300 py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300/80 text-amber-950 px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs">
            <Landmark className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span>
              {hi
                ? 'भारत सरकार • राष्ट्रीय नागरिक कल्याण व अधिकार पहल'
                : 'Government of India • Citizen Entitlement Initiative'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0f2942] tracking-tight leading-snug">
            {hi
              ? 'अपने दस्तावेज़ों के आधार पर पात्र सरकारी योजनाएं खोजें'
              : 'Discover Government Schemes You Qualify For Based on Your Documents'}
          </h1>
          <p className="text-slate-700 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            {hi
              ? 'अपने सत्यापन दस्तावेज़ सुरक्षित लॉकर में अपलोड करें। सहायक स्वचालित रूप से आपको केंद्र और राज्य योजनाओं से जोड़ता है, स्पष्ट बताता है कि कौन से दस्तावेज़ शेष हैं, और पात्र होते ही तुरंत सूचित करता है।'
              : 'Upload your verification documents to your secure locker. SAHAYAK automatically matches you with Central and State schemes, clearly shows why you cannot apply yet, and notifies you the moment you become eligible.'}
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/citizen' : '/login'}
              className="w-full sm:w-auto bg-[#0f2942] hover:bg-[#1a3b5c] text-white font-semibold px-7 py-3 rounded text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>
                {isAuthenticated
                  ? hi
                    ? 'मेरे दस्तावेज़ डैशबोर्ड पर जाएं'
                    : 'Go to My Document Dashboard'
                  : hi
                  ? 'नागरिक के रूप में साइन इन / पंजीकरण करें'
                  : 'Sign In / Register as Citizen'}
              </span>
            </Link>
            <Link
              to="/schemes"
              className="w-full sm:w-auto text-center bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3 rounded text-xs sm:text-sm border border-slate-300 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{hi ? 'सभी सरकारी योजनाएं देखें' : 'Browse All Government Schemes'}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Core User Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#0f2942]">
            {hi ? 'सहायक कैसे काम करता है' : 'How SAHAYAK Works'}
          </h2>
          <p className="text-xs text-slate-600">
            {hi
              ? 'शून्य अनुमान और पारदर्शी नियमों के साथ प्रमाणिक योजना पात्रता सत्यापन।'
              : 'A transparent, deterministic eligibility verification journey with zero guesswork.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-300 p-5 rounded-lg space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-slate-100 text-[#0f2942] rounded-lg flex items-center justify-center text-sm font-bold border border-slate-200">
              01
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {hi ? 'अपने दस्तावेज़ अपलोड करें' : 'Upload Your Documents'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hi
                ? 'अपने डिजिटल लॉकर में आधार कार्ड, पैन, भूमि रिकॉर्ड या आय प्रमाण पत्र जोड़ें। योजना पात्रता मिलान के लिए प्रत्येक दस्तावेज़ का सत्यापन किया जाता है।'
                : 'Add your Aadhaar Card, PAN Card, Land Records, or Income Certificate to your digital document locker. Each credential is authenticated for scheme criteria matching.'}
            </p>
          </div>

          <div className="bg-white border border-slate-300 p-5 rounded-lg space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-amber-50 text-amber-900 rounded-lg flex items-center justify-center text-sm font-bold border border-amber-200">
              02
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {hi ? 'नियम-आधारित पात्रता जांच' : 'Deterministic Eligibility'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hi
                ? 'मंच आपके सत्यापित दस्तावेज़ों की तुलना केंद्र और राज्य नियमों से करता है। यदि आप पात्र नहीं हैं, तो कारण और छूटे हुए दस्तावेज़ों की चेकलिस्ट स्पष्ट दिखाई देती है।'
                : 'The platform compares your verified documents and demographics with Central and State rules. If you cannot apply, you see exact criteria items with clear missing document checklists.'}
            </p>
          </div>

          <div className="bg-white border border-slate-300 p-5 rounded-lg space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-900 rounded-lg flex items-center justify-center text-sm font-bold border border-emerald-200">
              03
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              {hi ? 'तत्काल सूचनाएं प्राप्त करें' : 'Real-Time Notifications'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hi
                ? 'जब भी आप कोई आवश्यक दस्तावेज़ अपलोड करते हैं या कोई नई योजना जारी होती है, तो आपको तुरंत इन-ऐप सूचनाएं और अलर्ट प्राप्त होते हैं।'
                : 'Whenever you upload a required document or an administrator opens a new welfare program, you receive instant alerts on eligible benefits.'}
            </p>
          </div>
        </div>
      </section>

      {/* Primary Call to Action */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-[#0f2942] text-white rounded-lg p-6 sm:p-8 text-center space-y-4 shadow-sm border-t-2 border-amber-400">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {hi
              ? 'क्या आप अपनी योजना पात्रता जांचने के लिए तैयार हैं?'
              : 'Ready to Verify Your Scheme Entitlements?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
            {hi
              ? 'पीएम-किसान, पीएम आवास योजना, आयुष्मान भारत और राज्य कल्याणकारी योजनाओं की व्यक्तिगत पात्रता देखने के लिए लॉगिन करें।'
              : 'Log in to manage your documents and get personalized eligibility for PM-KISAN, PMAY Housing, Ayushman Bharat, and State welfare schemes.'}
          </p>
          <div className="pt-2">
            <Link
              to={isAuthenticated ? '/citizen' : '/login'}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-2.5 rounded text-xs shadow-xs transition cursor-pointer"
            >
              <span>{hi ? 'नागरिक डैशबोर्ड खोलें' : 'Open Citizen Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
