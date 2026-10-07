import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations.js';
import { getGrievances, createGrievance, getSchemes } from '../services/api.js';
import GrievanceCard from '../components/GrievanceCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { FileText, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function GrievancesPage({ language }) {
  const [grievances, setGrievances] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const [form, setForm] = useState({
    scheme_name: 'PM-KISAN',
    department: 'Department of Agriculture & Farmers Welfare',
    complaint_text: '',
    citizen_name: '',
    citizen_phone: '',
    priority: 'HIGH',
  });

  const navigate = useNavigate();
  const t = (key) => getTranslation(language, key);

  useEffect(() => {
    getGrievances().then(setGrievances);
    getSchemes().then((sc) => setSchemes(sc || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.complaint_text.trim()) return;
    setSubmitting(true);
    try {
      const created = await createGrievance(form);
      setGrievances((prev) => [created, ...(prev || [])]);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setModalOpen(false);
        setForm({
          scheme_name: 'PM-KISAN',
          department: 'Department of Agriculture & Farmers Welfare',
          complaint_text: '',
          citizen_name: '',
          citizen_phone: '',
          priority: 'HIGH',
        });
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-3 flex justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Citizen Grievance Redressal</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Lodge complaints regarding delayed disbursements, verification disputes, or technical rejections.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white px-3.5 py-1.5 rounded text-xs font-semibold transition shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>File Grievance</span>
        </button>
      </div>

      {!grievances ? (
        <LoadingState />
      ) : grievances.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3 shadow-2xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Grievances Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any active or resolved grievance tickets. If you encounter issues with any government scheme application or disbursement, you can register a ticket here.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white px-4 py-1.5 rounded text-xs font-semibold transition cursor-pointer"
          >
            File Your First Grievance
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map((item) => (
            <GrievanceCard key={item.id} grievance={item} language={language} onView={(id) => navigate(`/grievances/${id}`)} />
          ))}
        </div>
      )}

      {/* File Grievance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Lodge Official Grievance</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <p className="font-bold">Grievance Ticket Lodged Successfully!</p>
                <p className="text-[11px] text-emerald-800">Your ticket has been dispatched to the concerned department.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Related Scheme</label>
                  <select
                    value={form.scheme_name}
                    onChange={(e) => setForm({ ...form, scheme_name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942] bg-white font-medium"
                  >
                    {schemes.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="General Public Scheme">Other Public Scheme / General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Concerned Department</label>
                  <input
                    type="text"
                    required
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Department of Agriculture & Farmers Welfare"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Describe Grievance / Issue</label>
                  <textarea
                    rows={4}
                    required
                    value={form.complaint_text}
                    onChange={(e) => setForm({ ...form, complaint_text: e.target.value })}
                    placeholder="Detail the issue, timeline, application reference number, or transaction failure..."
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={form.citizen_name}
                      onChange={(e) => setForm({ ...form, citizen_name: e.target.value })}
                      placeholder="Applicant Name"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={form.citizen_phone}
                      onChange={(e) => setForm({ ...form, citizen_phone: e.target.value })}
                      placeholder="+91..."
                      className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white px-4 py-1.5 rounded font-semibold cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Grievance Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
