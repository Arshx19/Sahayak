import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-full text-slate-700 hover:bg-slate-100 transition focus:outline-none"
        aria-label="View notifications"
      >
        <span className="text-base" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-300 rounded-lg shadow-xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="bg-[#1b365d] text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <span>🔔</span>
              <span>Scheme Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px]">
                  {unreadCount} New
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-amber-300 hover:text-white font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <span className="text-2xl block mb-1">📭</span>
                <span>No new notifications at this time.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3 space-y-1 cursor-pointer transition ${
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/60 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900 leading-snug">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                  {notif.schemeId && (
                    <Link
                      to={`/schemes/${notif.schemeId}`}
                      onClick={() => setOpen(false)}
                      className="inline-block text-[11px] font-bold text-[#1b365d] hover:underline pt-0.5"
                    >
                      View Scheme Guidelines →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px]">
              <span className="text-slate-500">
                Real-time scheme updates
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-500 hover:text-rose-600 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
