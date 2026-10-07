import { createContext, useContext, useState, useEffect } from 'react';
import { getUserNotifications, markNotificationAsRead as apiMarkRead, markAllNotificationsRead as apiMarkAllRead } from '../services/api.js';

const NotificationContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('sahayak_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    let isMounted = true;
    getUserNotifications().then((remoteNotifs) => {
      if (isMounted && remoteNotifs && remoteNotifs.length > 0) {
        setNotifications(remoteNotifs);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sahayak_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const addNotification = ({ title, message, type = 'SCHEME_NEW', schemeId = null }) => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      schemeId,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    apiMarkRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    apiMarkAllRead().catch(() => {});
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
