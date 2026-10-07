import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Link } from 'react-router-dom';
import { Bell, Inbox } from 'lucide-react';

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
        className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute 0 top-0.5 right-0.5 bg-rose-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="bg-[#0f2942] text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {unreadCount} New
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-slate-300 hover:text-white font-medium hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <Inbox className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">No Notifications</p>
                <p className="text-[11px] text-slate-400">You are all caught up on scheme updates and verifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3 space-y-1 cursor-pointer transition ${
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/80 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-slate-900 leading-snug">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                  {notif.schemeId && (
                    <Link
                      to={`/schemes/${notif.schemeId}`}
                      onClick={() => setOpen(false)}
                      className="inline-block text-[11px] font-semibold text-[#0f2942] hover:underline pt-0.5"
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
                Live Government Broadcasts
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
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
