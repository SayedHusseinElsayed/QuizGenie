import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Notification, NotificationType } from '../types';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const NotificationBell = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load notifications
    useEffect(() => {
        if (user) {
            loadNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const loadNotifications = async () => {
        if (!user) return;
        const data = await dbService.getNotifications(user.id);
        setNotifications(data);
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await dbService.markNotificationAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
            );
        }

        // Navigate based on type
        if (notification.quiz_id) {
            if (notification.type === NotificationType.QUIZ_INVITE) {
                navigate(`/quiz/${notification.quiz_id}`);
            } else if (notification.type === NotificationType.QUIZ_SUBMISSION) {
                navigate(`/quiz-manager/${notification.quiz_id}?tab=submissions`);
            }
        }

        setShowDropdown(false);
    };

    const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        await dbService.deleteNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const handleClearAll = async () => {
        if (!user) return;
        if (!window.confirm('Clear all notifications?')) return;

        setLoading(true);
        await dbService.clearAllNotifications(user.id);
        setNotifications([]);
        setLoading(false);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[500px] flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                disabled={loading}
                                className="text-xs text-slate-500 hover:text-red-600 font-medium transition"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 cursor-pointer transition hover:bg-slate-50 ${!notification.is_read ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.type === NotificationType.QUIZ_INVITE
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-green-100 text-green-600'
                                                }`}>
                                                {notification.type === NotificationType.QUIZ_INVITE ? (
                                                    <Bell size={16} />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900 mb-0.5">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-600 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {getTimeAgo(notification.created_at)}
                                                </p>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition shrink-0"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {/* Unread Indicator */}
                                        {!notification.is_read && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
