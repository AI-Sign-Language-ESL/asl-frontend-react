import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        type: 'meeting_invite',
        title: 'Meeting Invitation',
        message: 'Sarah Ahmed invited you to "Team Standup"',
        time: '5 min ago',
        read: false,
        actionUrl: '/meetings',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        type: 'subscription',
        title: 'Subscription Ending',
        message: 'Your Pro plan expires in 3 days',
        time: '1 hour ago',
        read: false,
        actionUrl: '/settings',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        type: 'tokens',
        title: 'Tokens Recharged',
        message: 'Your account has been credited with 500 tokens',
        time: '2 hours ago',
        read: true,
        actionUrl: null,
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      time: 'Just now',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};