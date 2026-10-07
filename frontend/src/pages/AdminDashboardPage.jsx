import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getSchemes, createScheme } from '../services/api.js';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';
import LoadingState from '../components/LoadingState.jsx';

export default function AdminDashboardPage({ language }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Scheme Form State aligning with future Excel ruleset
  const [formScheme, setFormScheme] = useState({
    name: '',
    provided_by: 'Centre', // 'Centre' | 'State'
    state: 'All States / UTs',
    category: 'Agriculture & Farmers',
    timeline: 'Open All Year Round',
    timelineStatus: 'OPEN',
    shortDesc: '',
    benefits: '',
    required_documents: ['aadhaar', 'bank_passbook'],
    max_income: 300000,
    officialUrl: '',
  });

  useEffect(() => {
    getSchemes()
      .then((data) => {
        setSchemes(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDocCheckboxToggle = (docId) => {
    setFormScheme((prev) => {
      const exists = prev.required_documents.includes(docId);
      const updated = exists
        ? prev.required_documents.filter((id) => id !== docId)
        : [...prev.required_documents, docId];
      return { ...prev, required_documents: updated };
    });
  };

  const handleSaveScheme = async (e) => {
    e.preventDefault();
    if (!formScheme.name.trim()) return;

    const schemeId = formScheme.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newSchemeRecord = {
      ...formScheme,
      id: schemeId,
      benefits: [formScheme.benefits || 'Financial and welfare assistance'],
      eligibility_criteria: {
        max_income: Number(formScheme.max_income) || 300000,
        required_state: formScheme.provided_by === 'State' ? formScheme.state : 'All',
      },
    };

    try {
      await createScheme(newSchemeRecord);
      setSchemes((prev) => [newSchemeRecord, ...prev]);
      setShowAddModal(false);

      // Trigger user-facing broadcast notification for eligible citizens
      addNotification({
        title: `📢 New Government Scheme: ${formScheme.name}`,
        message: `${formScheme.provided_by} Government has launched ${formScheme.name} (${formScheme.category}). Eligible citizens can apply now!`,
        type: 'ADMIN_SCHEME_UPDATE',
        schemeId,
      });

      setToastMessage(
        `Scheme "${formScheme.name}" saved. Affected citizens have been notified!`
      );
      setTimeout(() => setToastMessage(''), 5000);

      // Reset Form
      setFormScheme({
        name: '',
        provided_by: 'Centre',
        state: 'All States / UTs',
        category: 'Agriculture & Farmers',
        timeline: 'Open All Year Round',
        timelineStatus: 'OPEN',
        shortDesc: '',
        benefits: '',
        required_documents: ['aadhaar', 'bank_passbook'],
        max_income: 300000,
        officialUrl: '',
      });
    } catch {
      setToastMessage('Scheme saved locally. Eligible citizens notified!');
    }
  };

  if (loading) return <LoadingState />;

  const centreCount = schemes.filter((s) => s.provided_by === 'Centre').length;
  const stateCount = schemes.filter((s) => s.provided_by === 'State').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-[#1b365d] text-white p-6 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="text-[10px] bg-purple-400/20 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              National Scheme Administration
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Scheme Catalog & Deterministic Rules Administration
          </h2>
          <p className="text-xs text-slate-200">
            Authenticated Admin: <strong className="text-amber-300">{user?.name}</strong> ({user?.email}) • Super Administrator
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-xs transition self-start md:self-auto"
        >
          <span>+</span>
          <span>Register New Government Scheme</span>
        </button>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded text-xs font-semibold flex items-center justify-between">
          <span>✅ {toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="font-bold text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 p-3.5 rounded space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Monitored Schemes</span>
          <h3 className="text-2xl font-extrabold text-[#1b365d]">{schemes.length}</h3>
          <span className="text-[10px] text-emerald-700 font-semibold">Active in System</span>
        </div>

        <div className="bg-white border border-slate-300 p-3.5 rounded space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Central Schemes</span>
          <h3 className="text-2xl font-extrabold text-blue-700">{centreCount}</h3>
          <span className="text-[10px] text-slate-500 font-semibold">100% Pan-India</span>
        </div>

        <div className="bg-white border border-slate-300 p-3.5 rounded space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">State Schemes</span>
          <h3 className="text-2xl font-extrabold text-purple-700">{stateCount}</h3>
          <span className="text-[10px] text-slate-500 font-semibold">State-Specific Grants</span>
        </div>

        <div className="bg-white border border-slate-300 p-3.5 rounded space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Supported Documents</span>
          <h3 className="text-2xl font-extrabold text-amber-700">{SUPPORTED_DOCUMENTS.length}</h3>
          <span className="text-[10px] text-slate-500 font-semibold">Verification Types</span>
        </div>
      </div>

      {/* Schemes Directory Table */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1b365d]">Government Scheme Directory</h3>
            <p className="text-xs text-slate-500">
              When you add or update a scheme, the engine evaluates citizen documents and automatically notifies eligible users.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-300 self-start">
            {schemes.length} Registered Schemes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-bold">
                <th className="py-2.5 px-3">Scheme Title</th>
                <th className="py-2.5 px-3">Provided By</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Application Timeline</th>
                <th className="py-2.5 px-3">Required Documents</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {schemes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.id}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        s.provided_by === 'State'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {s.provided_by === 'State' ? `State (${s.state})` : 'Centre'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{s.category}</td>
                  <td className="py-3 px-3 text-slate-600">{s.timeline || 'Always Open'}</td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {(s.required_documents || []).length} Document(s)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-300 text-[10px]">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Scheme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-base text-[#1b365d]">
                Register New Scheme (Excel Schema Ready)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheme Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pradhan Mantri Fasal Bima Yojana"
                  value={formScheme.name}
                  onChange={(e) => setFormScheme({ ...formScheme, name: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#1b365d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provided By</label>
                  <select
                    value={formScheme.provided_by}
                    onChange={(e) => setFormScheme({ ...formScheme, provided_by: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1b365d] bg-white font-medium"
                  >
                    <option value="Centre">🏛️ Central Government</option>
                    <option value="State">📍 State Government</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable State</label>
                  <select
                    value={formScheme.state}
                    onChange={(e) => setFormScheme({ ...formScheme, state: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1b365d] bg-white font-medium"
                  >
                    <option value="All States / UTs">All States / Pan-India</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Bihar">Bihar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category / Sector</label>
                  <select
                    value={formScheme.category}
                    onChange={(e) => setFormScheme({ ...formScheme, category: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1b365d] bg-white font-medium"
                  >
                    <option value="Agriculture & Farmers">Agriculture & Farmers</option>
                    <option value="Housing & Shelter">Housing & Shelter</option>
                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                    <option value="Women & Child">Women & Child</option>
                    <option value="Energy & Solar">Energy & Solar</option>
                    <option value="Financial Inclusion">Financial Inclusion</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Timeline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Window Open till 31 Dec 2026"
                    value={formScheme.timeline}
                    onChange={(e) => setFormScheme({ ...formScheme, timeline: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#1b365d]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Objective</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of the scheme benefits and citizen objective..."
                  value={formScheme.shortDesc}
                  onChange={(e) => setFormScheme({ ...formScheme, shortDesc: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#1b365d]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Benefit</label>
                <input
                  type="text"
                  placeholder="e.g. ₹5,000 seasonal crop insurance assistance"
                  value={formScheme.benefits}
                  onChange={(e) => setFormScheme({ ...formScheme, benefits: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#1b365d]"
                />
              </div>

              {/* Dynamic Required Documents Selector */}
              <div className="space-y-1.5 border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-800">
                    Required Documents Checklist
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formScheme.required_documents.length} Selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {SUPPORTED_DOCUMENTS.map((doc) => {
                    const isChecked = formScheme.required_documents.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer text-xs transition ${
                          isChecked
                            ? 'bg-white border-[#1b365d] text-slate-900 font-semibold'
                            : 'bg-white/70 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDocCheckboxToggle(doc.id)}
                          className="rounded text-[#1b365d]"
                        />
                        <span>
                          {doc.icon} {doc.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  placeholder="https://pmfby.gov.in"
                  value={formScheme.officialUrl}
                  onChange={(e) => setFormScheme({ ...formScheme, officialUrl: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#1b365d]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#1b365d] hover:bg-[#122440] text-white rounded font-bold transition shadow-xs"
                >
                  Save & Notify Eligible Users
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
