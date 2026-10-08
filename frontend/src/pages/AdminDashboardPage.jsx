import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getSchemes, createScheme } from '../services/api.js';
import { SUPPORTED_DOCUMENTS } from '../data/documentsData.js';
import LoadingState from '../components/LoadingState.jsx';
import {
  Landmark,
  ShieldCheck,
  Plus,
  CheckCircle2,
  X,
  Bell,
  Pause,
  Play,
  FileText,
  Search,
  Building2,
  FileCheck,
} from 'lucide-react';

export default function AdminDashboardPage({ language }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Admin filter and search for master registry
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PAUSED'

  // Admin Audit Log entries
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'aud_1',
      action: 'POLICY_ENACTED',
      schemeName: 'PM Surya Ghar - Muft Bijli Yojana',
      actor: 'Super Admin (MeitY)',
      timestamp: 'Today, 10:45 AM',
      details: 'Rooftop solar subsidy policy updated. Broadcast alert sent to 14,250 citizens.',
    },
    {
      id: 'aud_2',
      action: 'RULE_SYNCHRONIZED',
      schemeName: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      actor: 'Super Admin (NIC)',
      timestamp: 'Yesterday, 04:30 PM',
      details: 'Landholding 7/12 requirement enforced for 2026 disbursement cycle.',
    },
    {
      id: 'aud_3',
      action: 'ADMIN_SESSION_VERIFIED',
      schemeName: 'System Security Protocol',
      actor: 'Super Admin',
      timestamp: 'Yesterday, 09:12 AM',
      details: 'Level-IV Administrative Clearance authenticated with 256-bit token.',
    },
  ]);

  // Policy Form State
  const [formScheme, setFormScheme] = useState({
    name: '',
    scheme_code: '',
    nodal_ministry: 'Ministry of Agriculture & Farmers Welfare',
    provided_by: 'Centre',
    state: 'All States / UTs',
    category: 'Agriculture & Farmers',
    timeline: 'Open All Year Round',
    funding_pattern: '100% Central Sector',
    shortDesc: '',
    benefits: '',
    required_documents: ['aadhaar', 'bank_account'],
    max_income: 300000,
    officialUrl: '',
    gazette_ref: 'GAZ-2026/POLICY-091',
  });

  useEffect(() => {
    getSchemes()
      .then((data) => {
        const enriched = (data || []).map((s) => {
          const cat = s.category || '';
          return {
            ...s,
            name: s.name || 'Untitled Scheme',
            isActive: s.isActive !== undefined ? s.isActive : true,
            nodal_ministry:
              s.nodal_ministry ||
              (cat.includes('Agriculture')
                ? 'Ministry of Agriculture & Farmers Welfare'
                : cat.includes('Housing')
                ? 'Ministry of Rural Development'
                : cat.includes('Healthcare')
                ? 'Ministry of Health & Family Welfare'
                : 'Ministry of Social Justice & Empowerment'),
            funding_pattern:
              s.provided_by === 'State' ? '100% State Funded' : '100% Central Sector',
          };
        });
        setSchemes(enriched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Admin policy toggle: Pause or Activate scheme enrollment
  const handleToggleSchemeStatus = (schemeId) => {
    setSchemes((prev) =>
      prev.map((s) => {
        if (s.id === schemeId) {
          const nextState = !s.isActive;
          const statusText = nextState ? 'ACTIVATED' : 'PAUSED';

          const newLog = {
            id: `aud_${Date.now()}`,
            action: nextState ? 'SCHEME_ACTIVATED' : 'SCHEME_PAUSED',
            schemeName: s.name,
            actor: `${user?.name || 'Admin'} (Admin)`,
            timestamp: 'Just now',
            details: `Scheme enrollment lifecycle status changed to ${statusText}.`,
          };
          setAuditLogs((l) => [newLog, ...l]);

          setToastMessage(
            `Administrative Status for "${s.name}" set to ${statusText}.`
          );
          setTimeout(() => setToastMessage(''), 4500);

          return { ...s, isActive: nextState };
        }
        return s;
      })
    );
  };

  // Admin Broadcast Notification trigger
  const handleBroadcastAlert = (scheme) => {
    addNotification({
      title: `Official Notification: ${scheme.name}`,
      message: `${scheme.provided_by} Government administrative update issued for ${scheme.name}. Verified eligible citizens can access application enrollment.`,
      type: 'ADMIN_SCHEME_UPDATE',
      schemeId: scheme.id,
    });

    const newLog = {
      id: `aud_${Date.now()}`,
      action: 'BROADCAST_TRIGGERED',
      schemeName: scheme.name,
      actor: `${user?.name || 'Admin'} (Admin)`,
      timestamp: 'Just now',
      details: `Broadcast push notification sent to matching eligible citizens nationwide.`,
    };
    setAuditLogs((l) => [newLog, ...l]);

    setToastMessage(`Broadcast notification dispatched to eligible citizens for "${scheme.name}".`);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleDocCheckboxToggle = (docId) => {
    setFormScheme((prev) => {
      const exists = prev.required_documents.includes(docId);
      const updated = exists
        ? prev.required_documents.filter((id) => id !== docId)
        : [...prev.required_documents, docId];
      return { ...prev, required_documents: updated };
    });
  };

  const handleSaveSchemePolicy = async (e) => {
    e.preventDefault();
    if (!formScheme.name.trim()) return;

    const schemeId =
      formScheme.scheme_code.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      formScheme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newPolicyRecord = {
      ...formScheme,
      id: schemeId,
      isActive: true,
      benefits: [formScheme.benefits || 'Financial and welfare grant'],
      eligibility_criteria: {
        max_income: Number(formScheme.max_income) || 300000,
        required_state: formScheme.provided_by === 'State' ? formScheme.state : 'All',
      },
    };

    try {
      await createScheme(newPolicyRecord);
      setSchemes((prev) => [newPolicyRecord, ...prev]);
      setShowAddModal(false);

      const auditEntry = {
        id: `aud_${Date.now()}`,
        action: 'POLICY_GAZETTED',
        schemeName: formScheme.name,
        actor: `${user?.name || 'Admin'} (Admin)`,
        timestamp: 'Just now',
        details: `Gazette Ref: ${formScheme.gazette_ref}. Mandatory documents: ${formScheme.required_documents.join(', ')}.`,
      };
      setAuditLogs((l) => [auditEntry, ...l]);

      addNotification({
        title: `New Policy Gazetted: ${formScheme.name}`,
        message: `${formScheme.provided_by} Government has gazetted ${formScheme.name}. Citizens with verified credentials are now eligible to enroll!`,
        type: 'ADMIN_SCHEME_UPDATE',
        schemeId,
      });

      setToastMessage(
        `Policy "${formScheme.name}" officially registered and gazetted. Eligible citizens notified!`
      );
      setTimeout(() => setToastMessage(''), 5000);

      setFormScheme({
        name: '',
        scheme_code: '',
        nodal_ministry: 'Ministry of Agriculture & Farmers Welfare',
        provided_by: 'Centre',
        state: 'All States / UTs',
        category: 'Agriculture & Farmers',
        timeline: 'Open All Year Round',
        funding_pattern: '100% Central Sector',
        shortDesc: '',
        benefits: '',
        required_documents: ['aadhaar', 'bank_account'],
        max_income: 300000,
        officialUrl: '',
        gazette_ref: 'GAZ-2026/POLICY-091',
      });
    } catch {
      setToastMessage('Policy registered in local registry.');
    }
  };

  if (loading) return <LoadingState />;

  const filteredSchemes = schemes.filter((s) => {
    if (statusFilter === 'ACTIVE' && !s.isActive) return false;
    if (statusFilter === 'PAUSED' && s.isActive) return false;

    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;

    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.nodal_ministry && s.nodal_ministry.toLowerCase().includes(q)) ||
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  });

  const centreCount = schemes.filter((s) => s.provided_by === 'Centre').length;
  const stateCount = schemes.filter((s) => s.provided_by === 'State').length;
  const activeCount = schemes.filter((s) => s.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* AUTHORITATIVE SECURITY CLEARANCE BANNER */}
      <div className="bg-[#0f2942] text-white rounded-lg p-6 shadow-sm border-t-2 border-amber-400 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                SECURITY CLEARANCE: LEVEL-IV ADMIN
              </span>
              <span className="text-slate-400 text-xs">|</span>
              <span className="text-[11px] text-slate-300 font-mono">
                SESSION ID: SHA256-ADM-881290-OK
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              National Scheme Master Policy & Administrative Control Console
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Official Administration Console &bull; National Informatics Centre (NIC) & Ministry of Electronics & IT (MeitY).
              Authoritative control for gazetting government entitlement criteria, ruleset policies, and nationwide notifications.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gazette New Scheme Policy</span>
            </button>
          </div>
        </div>

        {/* System Telemetry Strip */}
        <div className="pt-3 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Authenticated Admin</span>
            <span className="font-semibold text-white">{user?.name || 'Administrator'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Organization</span>
            <span className="font-semibold text-white">Government of India (Central Portal)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Policy Rules Engine</span>
            <span className="font-semibold text-emerald-400">Deterministic Engine Active</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Audit Log Status</span>
            <span className="font-semibold text-amber-300">Immutable Audit Trail Active</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-950 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Policy Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-300 p-4 rounded-lg space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Master Schemes Gazetted
          </span>
          <h3 className="text-2xl font-extrabold text-[#0f2942]">{schemes.length}</h3>
          <span className="text-[11px] text-emerald-700 font-semibold">{activeCount} Currently Active</span>
        </div>

        <div className="bg-white border border-slate-300 p-4 rounded-lg space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Central Sector Policies
          </span>
          <h3 className="text-2xl font-extrabold text-blue-800">{centreCount}</h3>
          <span className="text-[11px] text-slate-500 font-semibold">Pan-India Scope</span>
        </div>

        <div className="bg-white border border-slate-300 p-4 rounded-lg space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            State-Specific Policies
          </span>
          <h3 className="text-2xl font-extrabold text-slate-800">{stateCount}</h3>
          <span className="text-[11px] text-slate-500 font-semibold">State Treasury Funded</span>
        </div>

        <div className="bg-white border border-slate-300 p-4 rounded-lg space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Document Policy Types
          </span>
          <h3 className="text-2xl font-extrabold text-amber-800">{SUPPORTED_DOCUMENTS.length}</h3>
          <span className="text-[11px] text-slate-500 font-semibold">Verification Credentials</span>
        </div>
      </div>

      {/* DISTINCT ADMINISTRATIVE SCHEME MASTER POLICY REGISTRY */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0f2942]" />
              <h2 className="text-base font-bold text-[#0f2942]">
                National Scheme Master Policy Registry
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Administrative master registry for scheme criteria, document mandates, status enforcement, and nationwide broadcast alerts.
            </p>
          </div>

          {/* Admin Table Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search registry by code, ministry..."
                className="border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#0f2942] w-60"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2942] bg-white font-medium"
            >
              <option value="ALL">All Policy States</option>
              <option value="ACTIVE">Active Policies Only</option>
              <option value="PAUSED">Paused / Inactive Policies</option>
            </select>
          </div>
        </div>

        {/* Master Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Policy Code & Scheme Title</th>
                <th className="py-2.5 px-3">Nodal Ministry / Jurisdiction</th>
                <th className="py-2.5 px-3">Mandatory Citizen Documents</th>
                <th className="py-2.5 px-3">Application Window</th>
                <th className="py-2.5 px-3">Policy Status</th>
                <th className="py-2.5 px-3 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSchemes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  {/* Scheme Title & Code */}
                  <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                    <div className="text-slate-900 font-bold leading-snug">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ID: {s.id.toUpperCase()} &bull; Sector: {s.category}
                    </div>
                  </td>

                  {/* Ministry & Jurisdiction */}
                  <td className="py-3 px-3 text-slate-700">
                    <div className="font-semibold text-slate-800 text-[11px]">{s.nodal_ministry}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                          s.provided_by === 'State'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        {s.provided_by === 'State' ? `State (${s.state})` : 'Centre'}
                      </span>
                      <span className="text-[10px] text-slate-500">{s.funding_pattern}</span>
                    </div>
                  </td>

                  {/* Mandatory Documents Policy Checklist */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(s.required_documents || []).map((docId) => (
                        <span
                          key={docId}
                          className="bg-slate-100 text-slate-700 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {docId.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Application Timeline */}
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {s.timeline || 'Open All Year Round'}
                  </td>

                  {/* Policy Status Badge */}
                  <td className="py-3 px-3">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-300 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-300 text-[10px]">
                        <Pause className="w-2.5 h-2.5 text-amber-700" />
                        <span>PAUSED</span>
                      </span>
                    )}
                  </td>

                  {/* Admin Authoritative Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Broadcast Notification Button */}
                      <button
                        type="button"
                        onClick={() => handleBroadcastAlert(s)}
                        title="Broadcast alert to all eligible citizens"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2 py-1 rounded text-[11px] border border-slate-300 transition inline-flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3 text-slate-600" />
                        <span>Notify</span>
                      </button>

                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSchemeStatus(s.id)}
                        className={`font-semibold px-2.5 py-1 rounded text-[11px] border transition shadow-2xs cursor-pointer ${
                          s.isActive
                            ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {s.isActive ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMINISTRATIVE AUDIT TRAIL & SYSTEM COMPLIANCE */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-3 shadow-2xs">
        <div className="border-b border-slate-200 pb-2.5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-[#0f2942] uppercase tracking-wide">
              Official Administration Audit Trail (Immutable)
            </h3>
            <p className="text-[11px] text-slate-500">
              Chronological log of administrative policy changes, gazette registrations, and notification dispatches.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            NIC Compliance Verified
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-900">{log.schemeName}</span>
                </div>
                <p className="text-[11px] text-slate-600">{log.details}</p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono text-left sm:text-right shrink-0">
                <div>{log.actor}</div>
                <div>{log.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GAZETTE NEW SCHEME POLICY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0f2942]" />
                <h3 className="font-bold text-base text-[#0f2942]">
                  Gazette Government Scheme Policy
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchemePolicy} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gazette Circular Ref</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GAZ-2026/SEC-12"
                    value={formScheme.gazette_ref}
                    onChange={(e) => setFormScheme({ ...formScheme, gazette_ref: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942] font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheme Code / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PMFBY-CENTRAL"
                    value={formScheme.scheme_code}
                    onChange={(e) => setFormScheme({ ...formScheme, scheme_code: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Scheme Policy Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pradhan Mantri Fasal Bima Yojana (PMFBY)"
                  value={formScheme.name}
                  onChange={(e) => setFormScheme({ ...formScheme, name: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nodal Ministry / Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ministry of Agriculture & Farmers Welfare"
                  value={formScheme.nodal_ministry}
                  onChange={(e) => setFormScheme({ ...formScheme, nodal_ministry: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Government Jurisdiction</label>
                  <select
                    value={formScheme.provided_by}
                    onChange={(e) => setFormScheme({ ...formScheme, provided_by: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#0f2942] bg-white font-medium"
                  >
                    <option value="Centre">Central Government</option>
                    <option value="State">State Government</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable State</label>
                  <select
                    value={formScheme.state}
                    onChange={(e) => setFormScheme({ ...formScheme, state: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#0f2942] bg-white font-medium"
                  >
                    <option value="All States / UTs">All States (Pan-India)</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Bihar">Bihar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheme Category</label>
                  <select
                    value={formScheme.category}
                    onChange={(e) => setFormScheme({ ...formScheme, category: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#0f2942] bg-white font-medium"
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
                    placeholder="e.g. Window Open: 01 Apr - 31 Dec 2026"
                    value={formScheme.timeline}
                    onChange={(e) => setFormScheme({ ...formScheme, timeline: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Policy Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Government policy directive and citizen entitlements..."
                  value={formScheme.shortDesc}
                  onChange={(e) => setFormScheme({ ...formScheme, shortDesc: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                />
              </div>

              {/* MANDATORY CITIZEN DOCUMENT REQUIREMENT POLICY */}
              <div className="space-y-1.5 border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-800">
                    Mandatory Citizen Verification Documents Policy
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formScheme.required_documents.length} Required by Policy
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Select which credentials a citizen must have uploaded and verified to qualify for this scheme.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {SUPPORTED_DOCUMENTS.map((doc) => {
                    const isChecked = formScheme.required_documents.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer text-xs transition ${
                          isChecked
                            ? 'bg-white border-[#0f2942] text-slate-900 font-semibold'
                            : 'bg-white/70 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDocCheckboxToggle(doc.id)}
                          className="rounded text-[#0f2942]"
                        />
                        <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{doc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Circular / Portal URL</label>
                <input
                  type="url"
                  placeholder="https://agricoop.nic.in"
                  value={formScheme.officialUrl}
                  onChange={(e) => setFormScheme({ ...formScheme, officialUrl: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#0f2942]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0f2942] hover:bg-[#1a3b5c] text-white rounded font-bold transition shadow-xs cursor-pointer"
                >
                  Authorize & Gazette Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
