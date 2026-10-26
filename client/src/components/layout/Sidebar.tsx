import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Building2,
  CheckSquare,
  ShieldCheck,
  BarChart3,
  Clock,
  Users,
  FileCheck2,
  ChevronRight,
  Settings,
  Bell,
  User,
  ClipboardList,
  History,
  BookOpen,
  AlarmClock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth.types';

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  systemStatus: {
    connected: boolean;
    dbName: string;
    environment: string;
  };
}

/**
 * Role-specific sidebar navigation menus per the 6-role spec.
 * Items shown exactly as defined in requirements.
 */
const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  Admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Users & Roles', path: '/settings/users', icon: Users },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Vendors', path: '/vendors', icon: Building2 },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare },
    { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Audit Logs', path: '/audit-logs', icon: Clock },
    { label: 'Reminder Jobs', path: '/reminder-jobs', icon: AlarmClock },
    { label: 'Settings', path: '/system-settings', icon: Settings },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  Procurement: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Vendors', path: '/vendors', icon: Building2 },
    { label: 'Submitted for Approval', path: '/approvals', icon: ClipboardList },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  Legal: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  Finance: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Vendors', path: '/vendors', icon: Building2 },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  Approver: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Pending Approvals', path: '/approvals', icon: CheckSquare },
    { label: 'Approval History', path: '/approval-history', icon: History },
    { label: 'Assigned Contracts', path: '/contracts', icon: FileText },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  Viewer: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Contracts', path: '/contracts', icon: FileText },
    { label: 'Vendors', path: '/vendors', icon: Building2 },
    { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { label: 'Approval History', path: '/approval-history', icon: History },
    { label: 'Audit Logs', path: '/audit-logs', icon: Clock },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, systemStatus }) => {
  const { user } = useAuth();

  const role = (user?.role || 'Viewer') as UserRole;
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE['Viewer'];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <FileCheck2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">ContractFlow</span>
          <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">CLM Enterprise</span>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/dashboard' && currentPath === '/');

          return (
            <button
              key={`${item.path}-${item.label}`}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          );
        })}
      </nav>

      {/* User Context & Role Pill */}
      <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
        <div className="overflow-hidden">
          <div className="text-[10px] uppercase text-slate-400 font-semibold">Signed in as</div>
          <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Guest'}</div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
          {user?.role || 'Viewer'}
        </span>
      </div>

      {/* System Status Card */}
      <div className="p-4 m-3 mt-0 rounded-xl bg-slate-800/60 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">System</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              systemStatus.connected
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                : 'bg-amber-950 text-amber-400 border border-amber-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {systemStatus.connected ? 'Connected' : 'Connecting'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">
          DB: <span className="text-slate-300 font-mono">{systemStatus.dbName || 'contractflow'}</span>
        </p>
        <p className="text-[11px] text-slate-400">
          Env: <span className="text-slate-300 capitalize">{systemStatus.environment}</span>
        </p>
      </div>
    </aside>
  );
};
