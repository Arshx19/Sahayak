import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getTranslation } from '../utils/translations.js';
import { getGrievanceById, updateGrievanceStatus } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import GrievanceTimeline from '../components/GrievanceTimeline.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { ArrowLeft, UserCheck, Send, CheckCircle2, Building2, Phone, Calendar, ShieldCheck } from 'lucide-react';

export default function GrievanceDetailPage({ language }) {
  const { grievanceId } = useParams();
  const { user } = useAuth();
  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);

  // Officer action form
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';
  const t = (key) => getTranslation(language, key);
  const hi = language === 'hi';

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await getGrievanceById(grievanceId);
      setG(data);
      if (data) {
        setNewStatus(data.status === 'OPEN' ? 'IN_PROGRESS' : data.status || 'RESOLVED');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [grievanceId]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!g) return;
    setSubmitting(true);
    try {
      const remark = comment.trim() || `Status updated to ${newStatus}`;
      await updateGrievanceStatus(g.id || g.ticket_id, {
        status: newStatus,
        comment: remark,
        officerName: user?.name || 'Pooja Deshmukh (Nodal Officer)',
      });
      setSuccessMsg(hi ? 'शिकायत की स्थिति सफलतापूर्वक अद्यतन की गई।' : 'Status successfully updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setComment('');
      await loadTicket();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !g) return <LoadingState />;

  const backLink = isOfficerOrAdmin ? '/officer' : '/grievances';
  const backLabel = isOfficerOrAdmin
    ? hi
      ? '← अधिकारी डैशबोर्ड पर वापस जाएं'
      : '← Back to Officer Dashboard'
    : t('backToGrievances');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <Link to={backLink} className="text-xs font-semibold text-[#0f2942] hover:underline inline-flex items-center gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{backLabel}</span>
      </Link>

      {successMsg && (
        <div className="bg-emerald-700 text-white text-xs px-4 py-2 rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-300 rounded p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-start border-b border-slate-200 pb-3 gap-2">
          <div>
            <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {t('ticketNo')}{g.id || g.ticket_id}
            </span>
            <h2 className="text-base font-bold text-[#0f2942] mt-1.5">{hi ? g.hiSubject || g.subject : g.subject}</h2>
          </div>
          <StatusBadge status={g.status} />
        </div>

        {/* Overview Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-3 rounded text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Welfare Scheme</span>
            <span className="font-bold text-[#0f2942]">{g.scheme || g.scheme_name || 'PM-KISAN'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Department</span>
            <span className="font-bold text-slate-800">{g.department || 'Public Grievance Redressal'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Date Registered</span>
            <span className="font-bold text-slate-800">{g.date || 'Recent'}</span>
          </div>
        </div>

        {/* Complaint details */}
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Grievance Description</h3>
          <p className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-800 leading-relaxed">
            {g.complaint_text || g.subject}
          </p>
        </div>

        {/* Officer Resolution Controls (Visible for Officer / Admin) */}
        {isOfficerOrAdmin && (
          <div className="bg-amber-50/50 border border-amber-300 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0f2942]">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Officer Action & Resolution Panel</span>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Set New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0f2942]"
                  >
                    <option value="OPEN">OPEN (Under Review)</option>
                    <option value="ASSIGNED">ASSIGNED (Field Officer Assigned)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Investigation in Progress)</option>
                    <option value="RESOLVED">RESOLVED (Redressed & Closed)</option>
                    <option value="REJECTED">REJECTED (Ineligible)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Acting Officer</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || 'Pooja Deshmukh (Nodal Officer)'}
                    className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Resolution Remarks</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter resolution notes, DBT payment reference, or verification outcome..."
                  required
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-[#0f2942]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#0f2942] hover:bg-[#1a3b5c] text-white px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Updating...' : 'Commit Status & Add Remark'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[#0f2942] uppercase tracking-wider">{t('timeline')}</h3>
          <GrievanceTimeline history={g.history} language={language} />
        </div>
      </div>
    </div>
  );
}
