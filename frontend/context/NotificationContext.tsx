import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { notificationAPI } from '../src/api';
import { useAuth } from './AuthContext';

export interface NotificationItem {
  _id: string;
  message: string;
  type: 'admin' | 'schedule';
  targetRole: 'teacher' | 'student' | 'all';
  createdAt: string;
  isRead: boolean;
  scheduleId?: string;
  createdBy?: {
    name?: string;
    role?: string;
  };
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createAdminNotification: (message: string) => Promise<boolean>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    if (user.role === 'admin') {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications || []);
      setError('');
    } catch (fetchError) {
      console.error('Failed to fetch notifications:', fetchError);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
    } catch (markError) {
      console.error('Failed to mark notification as read:', markError);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

    try {
      await notificationAPI.markAllRead();
    } catch (markAllError) {
      console.error('Failed to mark notifications as read:', markAllError);
    }
  };

  const createAdminNotification = async (message: string): Promise<boolean> => {
    try {
      await notificationAPI.createAdmin(message);
      return true;
    } catch (createError) {
      console.error('Failed to create admin notification:', createError);
      return false;
    }
  };

  const clearError = () => setError('');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'admin') return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthenticated, user]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        createAdminNotification,
        clearError
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
