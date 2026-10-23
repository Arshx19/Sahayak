import { useEffect, useState, useMemo } from 'react';
import { getTranslation } from '../utils/translations.js';
import { getAllGrievances, updateGrievanceStatus } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  FileText,
  Building2,
  Phone,
  UserCheck,
  MessageSquare,
  X,
  Send,
  History,
  Check,
  Award,
} from 'lucide-react';

export default function OfficerDashboardPage({ language }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [historyModalTicket, setHistoryModalTicket] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Resolution Form state
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [officerComment, setOfficerComment] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('Pooja Deshmukh (Nodal Officer)');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const hi = language === 'hi';
  const t = (key) => getTranslation(language, key);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const all = await getAllGrievances();
      setTickets(all || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered tickets computation
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status filter
      if (filterStatus !== 'ALL') {
        const s = (ticket.status || '').toUpperCase();
        if (filterStatus === 'PENDING') {
          if (s !== 'ASSIGNED' && s !== 'IN_PROGRESS') return false;
        } else if (s !== filterStatus) {
          return false;
        }
      }

      // Department filter
      if (filterDepartment !== 'ALL') {
        if (!ticket.department || !ticket.department.toLowerCase().includes(filterDepartment.toLowerCase())) {
          return false;
        }
      }

      // Priority filter
      if (filterPriority !== 'ALL') {
        if ((ticket.priority || '').toUpperCase() !== filterPriority) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (ticket.id || '').toLowerCase().includes(q) ||
          (ticket.ticket_id || '').toLowerCase().includes(q) ||
          (ticket.citizen_name || '').toLowerCase().includes(q) ||
          (ticket.citizen_phone || '').includes(q) ||
          (ticket.scheme || '').toLowerCase().includes(q) ||
          (ticket.subject || '').toLowerCase().includes(q) ||
          (ticket.complaint_text || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [tickets, filterStatus, filterDepartment, filterPriority, searchQuery]);

  // Compute live KPI metrics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => (t.status || '').toUpperCase() === 'OPEN').length;
    const inProgress = tickets.filter(
      (t) => (t.status || '').toUpperCase() === 'ASSIGNED' || (t.status || '').toUpperCase() === 'IN_PROGRESS'
    ).length;
    const resolved = tickets.filter((t) => (t.status || '').toUpperCase() === 'RESOLVED').length;
    const rejected = tickets.filter((t) => (t.status || '').toUpperCase() === 'REJECTED').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    return { total, open, inProgress, resolved, rejected, rate };
  }, [tickets]);

  const handleOpenActionModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status || 'RESOLVED');
    setOfficerComment('');
  };

  const handleApplyTemplate = (text) => {
    setOfficerComment((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setUpdating(true);

    try {
      const comment = officerComment.trim() || `Official action recorded: Status changed to ${newStatus}`;
      const res = await updateGrievanceStatus(selectedTicket.id, {
        status: newStatus,
        comment,
        officerName: assignedOfficer,
      });

      // Update local state immediately
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === selectedTicket.id) {
            const history = [...(t.history || [])];
            history.push({
              step: `Status: ${newStatus}`,
              hiStep: `स्थिति: ${newStatus}`,
              date: new Date().toISOString().split('T')[0],
              desc: comment,
              hiDesc: comment,
              done: true,
              updatedBy: assignedOfficer,
            });
            return {
              ...t,
              status: newStatus,
              history,
            };
          }
          return t;
        })
      );

      setToastMessage(
        hi
          ? `शिकायत #${selectedTicket.id} की स्थिति सफलतापूर्वक ${newStatus} में अद्यतन की गई।`
          : `Grievance #${selectedTicket.id} status successfully updated to ${newStatus}.`
      );
      setTimeout(() => setToastMessage(''), 5000);
      setSelectedTicket(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const priorityBadge = (priority) => {
    const p = (priority || 'HIGH').toUpperCase();
    if (p === 'URGENT') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
          URGENT
        </span>
      );
    }
    if (p === 'HIGH') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
          HIGH
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
        MEDIUM
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-700 text-white text-xs px-4 py-2.5 rounded shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-white hover:text-emerald-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0f2942] text-amber-400 p-1.5 rounded">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-[#0f2942]">
                {hi ? 'लोक शिकायत निवारण नोडल अधिकारी पोर्टल' : 'Public Grievance Redressal — Nodal Officer Console'}
              </h1>
              <p className="text-xs text-slate-500">
                {hi
                  ? 'नागरिक शिकायतों की वास्तविक समय में निगरानी, जांच व निस्तारण प्रबंधन'
                  : 'Real-Time Citizen Grievance Triage, Direct Escalation & Redressal Management'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">Pooja Deshmukh</div>
            <div className="text-[10px] text-slate-500">District Nodal Grievance Officer • Satara / Pune Division</div>
          </div>
          <span className="text-xs bg-[#0f2942] text-white px-2.5 py-1 rounded font-mono font-bold tracking-wider">
            OFF-8812
          </span>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{hi ? 'कुल शिकायतें' : 'Total Grievances'}</span>
            <FileText className="w-4 h-4 text-[#0f2942]" />
          </div>
          <div className="text-2xl font-bold text-[#0f2942] mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all departments</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{hi ? 'प्रारंभिक समीक्षा (Open)' : 'Open / Unassigned'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{stats.open}</div>
          <div className="text-[10px] text-rose-500 mt-0.5 font-medium">Requires initial triage</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{hi ? 'कार्यवाही जारी (Pending)' : 'Under Investigation'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{stats.inProgress}</div>
          <div className="text-[10px] text-amber-600 mt-0.5 font-medium">In Progress / Field check</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{hi ? 'सफलतापूर्वक निस्तारित' : 'Resolved & Redressed'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.resolved}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Remedy completed</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>{hi ? 'निस्तारण दर' : 'Resolution SLA'}</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">{stats.rate}%</div>
          <div className="text-[10px] text-purple-600 mt-0.5 font-medium">Target &gt; 90% SLA</div>
        </div>
      </div>

      {/* Triage & Management Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={hi ? 'टिकट सं., नागरिक का नाम, फोन या योजना खोजें...' : 'Search by ticket ID, citizen name, phone, or scheme...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#0f2942]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#0f2942]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="PENDING">Under Action (Assigned / In Progress)</option>
              <option value="RESOLVED">Resolved Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#0f2942]"
            >
              <option value="ALL">All Departments</option>
              <option value="Agriculture">Agriculture & Farmers Welfare</option>
              <option value="Health">Health Authority (AB-PMJAY)</option>
              <option value="Rural">Rural Development (PMAY)</option>
              <option value="Petroleum">Petroleum & Natural Gas (Ujjwala)</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#0f2942]"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>

            <button
              onClick={fetchTickets}
              className="p-1.5 text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 rounded border border-slate-300 cursor-pointer"
              title="Refresh grievance feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grievance Table */}
        {loading ? (
          <LoadingState />
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No matching grievances found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No citizen grievance tickets match your current filters. Clear the search or status filter to see all records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Citizen Info</th>
                  <th className="py-2.5 px-3">Scheme & Department</th>
                  <th className="py-2.5 px-3">Complaint Overview</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Officer Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredTickets.map((t) => (
                  <tr key={t.id || t.ticket_id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ticket ID */}
                    <td className="py-3 px-3 font-mono font-bold text-amber-900 whitespace-nowrap">
                      <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        {t.id || t.ticket_id}
                      </span>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">{t.date || 'Recent'}</div>
                    </td>

                    {/* Citizen Details */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{t.citizen_name || 'Citizen User'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{t.citizen_phone || '+91 98000 00000'}</span>
                      </div>
                    </td>

                    {/* Scheme & Dept */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#0f2942] block text-[11px]">{t.scheme || t.scheme_name}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[180px]" title={t.department}>
                        {t.department}
                      </span>
                    </td>

                    {/* Complaint Overview */}
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 leading-relaxed" title={t.complaint_text || t.subject}>
                        {t.complaint_text || t.subject}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {priorityBadge(t.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleOpenActionModal(t)}
                        className="bg-[#0f2942] hover:bg-[#1e3a5f] text-white px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                        title="Update status & add resolution notes"
                      >
                        <UserCheck className="w-3 h-3 text-amber-300" />
                        <span>Take Action</span>
                      </button>

                      <button
                        onClick={() => setHistoryModalTicket(t)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[11px] font-medium border border-slate-300 transition cursor-pointer inline-flex items-center gap-1"
                        title="View audit trail"
                      >
                        <History className="w-3 h-3 text-slate-500" />
                        <span>History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESOLUTION / TRIAGE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-mono">
                    {selectedTicket.id || selectedTicket.ticket_id}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <h3 className="text-base font-bold text-[#0f2942] mt-1.5">
                  {hi ? 'अधिकारी शिकायत निस्तारण व स्थिति अद्यतन' : 'Officer Grievance Redressal & Resolution Form'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen & Scheme Overview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Beneficiary / Citizen</span>
                  <span className="font-bold text-slate-800">{selectedTicket.citizen_name || 'Rameshwar Patil'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact Number</span>
                  <span className="font-bold text-slate-800">{selectedTicket.citizen_phone || '+91 98220 12345'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Welfare Scheme</span>
                  <span className="font-bold text-[#0f2942]">{selectedTicket.scheme || selectedTicket.scheme_name}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Citizen Statement / Grievance</span>
                <p className="bg-white p-2.5 rounded border border-slate-200 text-slate-700 italic">
                  "{selectedTicket.complaint_text || selectedTicket.subject}"
                </p>
              </div>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {hi ? 'नई स्थिति चुनें (Advance Status)' : 'Update Status *'}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0f2942]"
                  >
                    <option value="OPEN">OPEN (Under Scrutiny)</option>
                    <option value="ASSIGNED">ASSIGNED (Assigned to Field Officer)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Investigation / DBT Validation Underway)</option>
                    <option value="RESOLVED">RESOLVED (Redressed & Remedy Completed)</option>
                    <option value="REJECTED">REJECTED (Ineligible / Disqualified Submission)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {hi ? 'जिम्मेदार नोडल अधिकारी' : 'Handling Nodal Officer'}
                  </label>
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#0f2942]"
                  />
                </div>
              </div>

              {/* Official Comments */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-bold">
                    {hi ? 'सरकारी टिप्पणी / निस्तारण टिप्पणी (Official Remarks) *' : 'Official Resolution Remarks / Action Notes *'}
                  </label>
                  <span className="text-[10px] text-slate-400">Recorded on official audit timeline</span>
                </div>
                <textarea
                  rows={3}
                  value={officerComment}
                  onChange={(e) => setOfficerComment(e.target.value)}
                  placeholder={
                    hi
                      ? 'निस्तारण विवरण, पीएफएमएस संदर्भ सं., या ग्राम रोजगार सहायक निरीक्षण विवरण दर्ज करें...'
                      : 'Provide official remarks, verification status, DBT sanction reference, or resolution details...'
                  }
                  required
                  className="w-full border border-slate-300 rounded p-2.5 text-xs focus:outline-none focus:border-[#0f2942]"
                />

                {/* Quick Templates */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold self-center">Quick templates:</span>
                  {[
                    'DBT sanction validated; payment released',
                    'NPCI Aadhaar Payment Bridge re-linked',
                    'Field inspection verified by Gram Rozgar Sahayak',
                    'Aadhaar eKYC demographic mismatch resolved',
                  ].map((temp, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleApplyTemplate(temp)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300 cursor-pointer"
                    >
                      + {temp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#1a3b5c] text-white font-bold rounded shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{updating ? 'Saving...' : 'Broadcast & Commit Resolution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET TIMELINE AUDIT MODAL */}
      {historyModalTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                  {historyModalTicket.id || historyModalTicket.ticket_id}
                </span>
                <h3 className="text-sm font-bold text-[#0f2942] mt-1">
                  {hi ? 'शिकायत जीवन चक्र और ऑडिट इतिहास' : 'Grievance Audit Lifecycle History'}
                </h3>
              </div>
              <button
                onClick={() => setHistoryModalTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {!historyModalTicket.history || historyModalTicket.history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No historical status transitions recorded.</p>
              ) : (
                <ol className="relative border-l border-slate-200 ml-2 space-y-4 text-xs">
                  {historyModalTicket.history.map((step, idx) => (
                    <li key={idx} className="ml-4">
                      <div className="absolute -left-1.5 mt-1 w-3 h-3 bg-emerald-600 rounded-full border border-white" />
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">
                          {hi ? step.hiStep || step.step : step.step}
                        </h4>
                        <span className="text-[10px] text-slate-400">{step.date}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{hi ? step.hiDesc || step.desc : step.desc}</p>
                      {step.updatedBy && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>Action by: {step.updatedBy}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryModalTicket(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
