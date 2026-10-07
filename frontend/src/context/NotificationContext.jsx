import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_welcome',
    title: 'Welcome to SAHAYAK Scheme Portal',
    message: 'Your Aadhaar Card, Photo ID, and Bank Passbook have been verified. Upload your Land Records to unlock PM-KISAN eligibility!',
    type: 'SYSTEM',
    timestamp: 'Just now',
    read: false,
  },
  {
    id: 'notif_solar',
    title: 'New Scheme Open: PM Surya Ghar Muft Bijli',
    message: 'Central Government has opened Phase 2 rooftop solar subsidies up to ₹78,000 for residential households.',
    type: 'SCHEME_UPDATE',
    schemeId: 'pm-surya-ghar',
    timestamp: '2 hours ago',
    read: false,
  },
];

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
    localStorage.setItem('sahayak_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = ({ title, message, type = 'ELIGIBILITY_UNLOCK', schemeId = null }) => {
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
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
