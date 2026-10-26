import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import { INotification } from '../../types/notification.types';
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  UserCheck,
  Check,
  CheckCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { UserRole } from '../../types/auth.types';

interface NavbarProps {
  pageTitle: string;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ pageTitle, onNavigate }) => {
  const { user, logout, quickSwitchRole, demoMode } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const data = await notificationService.getMyNotifications({ limit: 8 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Non-blocking in navbar
    } finally {
      setLoadingNotifs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif: INotification) => {
    if (!notif.isRead) {
      notificationService.markAsRead(notif._id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifDropdownOpen(false);

    if (notif.type === 'Compliance Alert' || notif.type === 'Expiry Warning') {
      if (onNavigate) onNavigate('/compliance');
    } else if (notif.type === 'Approval Request') {
      if (onNavigate) onNavigate('/approvals');
    } else if (onNavigate) {
      onNavigate('/contracts');
    }
  };

  const getRoleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Legal': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Procurement': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Finance': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Approver': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Viewer': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Expiry Warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />;
      case 'Renewal Reminder':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'Compliance Alert':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
      case 'Approval Request':
      case 'Approval Decision':
        return <CheckCheck className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  /** Clean role label: "Tom Reynolds, Viewer" */
  const roleLabel = user?.role || 'Guest';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{pageTitle}</h1>
      </div>

      {/* Middle Search Input */}
      <div className="hidden md:flex items-center w-72">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            readOnly
            placeholder="Search contracts, users, clauses..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          />
        </div>
      </div>

      {/* Right Actions & User Pill */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setUserDropdownOpen(false);
              fetchNotifications();
            }}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden text-xs">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <span>No notifications</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold truncate ${!notif.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif._id, e)}
                              className="text-slate-400 hover:text-blue-600 p-0.5"
                              title="Mark read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-center">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(false);
                    if (onNavigate) onNavigate('/notifications');
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Pill & Quick-Role Dropdown */}
        <div className="relative pl-3 border-l border-slate-200">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotifDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block">
              {/* Clean label: "Tom Reynolds, Viewer" */}
              <div className="text-xs font-semibold text-slate-800">
                {user?.name || 'Guest User'}, <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(user?.role)}`}>{roleLabel}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                {user?.email || 'Not logged in'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">

              {/* Demo Role Switcher — only rendered when DEMO_MODE=true from server */}
              {demoMode && (
                <>
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Switch Role Demo Persona</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Test the system as any of the 6 RBAC roles:
                    </p>
                  </div>

                  <div className="py-1">
                    {DEMO_ACCOUNTS.map((demo) => {
                      const isActive = user?.email === demo.email;
                      return (
                        <button
                          key={demo.role}
                          onClick={() => {
                            quickSwitchRole(demo.role);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                            isActive ? 'bg-blue-50/70 font-semibold text-blue-800' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span>{demo.name.split(' ')[0]}</span>
                            <span className="text-[10px] text-slate-400">{demo.description.slice(0, 32)}...</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(demo.role)}`}>
                            {demo.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 mt-1" />
                </>
              )}

              <button
                onClick={() => {
                  logout();
                  setUserDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
