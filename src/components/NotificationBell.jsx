import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, X, Clock, Video, CreditCard,
  Zap, Users, Calendar, Trash2, CheckCheck, Settings
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import classNames from 'classnames';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const { isAuthenticated } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'meeting_invite': return <Video className="w-4 h-4" />;
      case 'subscription': return <CreditCard className="w-4 h-4" />;
      case 'tokens': return <Zap className="w-4 h-4" />;
      case 'meeting_reminder': return <Calendar className="w-4 h-4" />;
      case 'participant_joined': return <Users className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'meeting_invite': return 'bg-primary/20 text-primary';
      case 'subscription': return 'bg-yellow-500/20 text-yellow-500';
      case 'tokens': return 'bg-success/20 text-success';
      case 'meeting_reminder': return 'bg-secondary/20 text-secondary';
      default: return 'bg-white/10 text-text-muted';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors text-text-muted hover:text-text-main"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px] z-50"
            >
              <div className="glass rounded-2xl border border-border-subtle shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-card/50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-main">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-text-main"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-text-muted" />
                      </div>
                      <p className="text-text-muted">No notifications yet</p>
                      <p className="text-xs text-text-muted mt-1">We'll notify you when something happens</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={classNames(
                            "p-4 flex gap-3 hover:bg-white/5 transition-colors cursor-pointer relative group",
                            !notification.read && "bg-primary/5"
                          )}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                            }
                          }}
                        >
                          {/* Unread indicator */}
                          {!notification.read && (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                          )}

                          {/* Icon */}
                          <div className={classNames(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1",
                            getIconColor(notification.type)
                          )}>
                            {getIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className={classNames(
                                  "font-semibold text-sm",
                                  !notification.read ? "text-text-main" : "text-text-muted"
                                )}>
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-all text-text-muted hover:text-red-500"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-text-muted" />
                              <span className="text-[10px] text-text-muted">{notification.time}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-border-subtle bg-bg-card/50">
                    <button className="w-full py-2 text-center text-sm text-text-muted hover:text-text-main transition-colors">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;