import React, { useState, useEffect } from 'react';
import api from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { VendorsListPage } from './pages/VendorsListPage';
import { ContractsListPage } from './pages/ContractsListPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { ApprovalsInboxPage } from './pages/ApprovalsInboxPage';
import { ComplianceRadarPage } from './pages/ComplianceRadarPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Lock,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Clock,
  BarChart3,
  CheckSquare,
  Users,
  Radar,
} from 'lucide-react';

interface HealthData {
  status: string;
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database: {
    status: string;
    readyState: number;
    name: string;
  };
}

/** Access Denied page shown when a user navigates to a forbidden route */
const AccessDeniedPage: React.FC<{ path: string }> = ({ path }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
      <ShieldAlert className="w-8 h-8 text-red-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
    <p className="text-slate-500 mb-2 max-w-md">
      You don't have permission to view <span className="font-mono text-slate-700">{path}</span>.
    </p>
    <p className="text-sm text-slate-400">
      Contact your administrator if you believe this is an error.
    </p>
  </div>
);

/** Dashboard widgets per role */
const AdminDashboard: React.FC<{ onNavigate: (p: string) => void; fetchHealth: () => void; loading: boolean; healthData: HealthData | null; error: string | null }> = ({ onNavigate, fetchHealth, loading, healthData, error }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Administration Dashboard</h2>
      <p className="text-xs text-slate-500">Full system access · {healthData?.database?.status === 'connected' ? 'Database connected' : 'Connecting...'}</p>
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Contracts', path: '/contracts', icon: FileText, color: 'blue' },
        { label: 'Vendors', path: '/vendors', icon: Building2, color: 'emerald' },
        { label: 'Users & Roles', path: '/settings/users', icon: Users, color: 'purple' },
        { label: 'Approvals', path: '/approvals', icon: CheckSquare, color: 'rose' },
        { label: 'Compliance', path: '/compliance', icon: ShieldCheck, color: 'amber' },
        { label: 'Audit Logs', path: '/audit-logs', icon: Clock, color: 'slate' },
        { label: 'Reports', path: '/reports', icon: BarChart3, color: 'indigo' },
        { label: 'Settings', path: '/system-settings', icon: Lock, color: 'slate' },
      ].map((item) => (
        <button key={item.path} onClick={() => onNavigate(item.path)}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left group">
          <item.icon className="w-5 h-5 text-slate-500 mb-2 group-hover:text-blue-600 transition-colors" />
          <div className="text-sm font-semibold text-slate-700">{item.label}</div>
        </button>
      ))}
    </div>
  </div>
);

const ProcurementDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Procurement Dashboard</h2>
      <p className="text-xs text-slate-500">Create and manage your contracts · Vendor directory access</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: 'My Contracts', path: '/contracts', icon: FileText },
        { label: 'Vendor Directory', path: '/vendors', icon: Building2 },
        { label: 'Submitted for Approval', path: '/approvals', icon: CheckSquare },
      ].map((item) => (
        <button key={item.path} onClick={() => onNavigate(item.path)}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left group">
          <item.icon className="w-5 h-5 text-slate-500 mb-2 group-hover:text-blue-600 transition-colors" />
          <div className="text-sm font-semibold text-slate-700">{item.label}</div>
        </button>
      ))}
    </div>
  </div>
);

const LegalDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Legal Dashboard</h2>
      <p className="text-xs text-slate-500">Contract review · Compliance governance · Legal approvals</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: 'Contracts (Read)', path: '/contracts', icon: FileText },
        { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
        { label: 'Approvals Inbox', path: '/approvals', icon: CheckSquare },
      ].map((item) => (
        <button key={item.path} onClick={() => onNavigate(item.path)}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left group">
          <item.icon className="w-5 h-5 text-slate-500 mb-2 group-hover:text-amber-600 transition-colors" />
          <div className="text-sm font-semibold text-slate-700">{item.label}</div>
        </button>
      ))}
    </div>
  </div>
);

const FinanceDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Finance Dashboard</h2>
      <p className="text-xs text-slate-500">Financial oversight · Tier-2 and Tier-3 approvals</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: 'Contracts (Read)', path: '/contracts', icon: FileText },
        { label: 'Vendor Directory', path: '/vendors', icon: Building2 },
        { label: 'Approvals Inbox', path: '/approvals', icon: CheckSquare },
      ].map((item) => (
        <button key={item.path} onClick={() => onNavigate(item.path)}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left group">
          <item.icon className="w-5 h-5 text-slate-500 mb-2 group-hover:text-blue-600 transition-colors" />
          <div className="text-sm font-semibold text-slate-700">{item.label}</div>
        </button>
      ))}
    </div>
  </div>
);

const ApproverDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Executive Approver Dashboard</h2>
      <p className="text-xs text-slate-500">Tier-3 final sign-off queue · Approval history</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: 'Pending Approvals', path: '/approvals', icon: CheckSquare },
        { label: 'Assigned Contracts', path: '/contracts', icon: FileText },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
      ].map((item) => (
        <button key={item.path} onClick={() => onNavigate(item.path)}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-rose-400 hover:shadow-md transition-all cursor-pointer text-left group">
          <item.icon className="w-5 h-5 text-slate-500 mb-2 group-hover:text-rose-600 transition-colors" />
          <div className="text-sm font-semibold text-slate-700">{item.label}</div>
        </button>
      ))}
    </div>
  </div>
);

const ViewerDashboard: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Viewer / Auditor Dashboard</h2>
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Read-only access · No create, edit, or export permissions
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: 'Contracts (Read)', path: '/contracts', icon: FileText },
        { label: 'Vendor Directory', path: '/vendors', icon: Building2 },
        { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
        { label: 'Approval History', path: '/approval-history', icon: CheckSquare },
        { label: 'Audit Logs', path: '/audit-logs', icon: Clock },
      ].map((item) => (
        <button key={item.path} onClick={() => onNavigate(item.path)}
          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all cursor-pointer text-left group">
          <item.icon className="w-5 h-5 text-slate-500 mb-2 group-hover:text-slate-700 transition-colors" />
          <div className="text-sm font-semibold text-slate-700">{item.label}</div>
        </button>
      ))}
    </div>
  </div>
);

/** Route-to-module permission guard map */
const ROUTE_PERMISSIONS: Record<string, { module: string; action: string }> = {
  '/settings/users': { module: 'users', action: 'read' },
  '/audit-logs': { module: 'audit-logs', action: 'read' },
  '/reminder-jobs': { module: 'reminder-jobs', action: 'read' },
  '/system-settings': { module: 'settings', action: 'read' },
  '/vendors': { module: 'vendors', action: 'read' },
  '/compliance': { module: 'compliance', action: 'read' },
  '/approvals': { module: 'approvals', action: 'read' },
  '/approval-history': { module: 'approvals', action: 'read' },
  '/contracts': { module: 'contracts', action: 'read' },
  '/reports': { module: 'reports', action: 'read' },
};

const MainApp: React.FC = () => {
  const { user, token, loading: authLoading, isAdmin, isProcurement, isLegal, isFinance, isApprover, isViewer, hasPermission } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<HealthData>('/health');
      setHealthData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch API health:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleNavigate = (path: string) => {
    setSelectedContractId(null);
    setCurrentPath(path);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>Initializing secure session...</span>
        </div>
      </div>
    );
  }

  if (!user && !token) {
    return <LoginPage onSuccess={() => handleNavigate('/dashboard')} />;
  }

  const systemStatus = {
    connected: healthData?.database?.status === 'connected',
    dbName: healthData?.database?.name || 'contractflow',
    environment: healthData?.environment || 'development',
  };

  const getPageTitle = () => {
    if (selectedContractId) return 'Contract Details';
    switch (currentPath) {
      case '/settings/users': return 'Users & Roles';
      case '/vendors': return 'Vendor Directory';
      case '/contracts': return 'Contracts Registry';
      case '/approvals': return 'Approvals Inbox';
      case '/approval-history': return 'Approval History';
      case '/compliance': return 'Compliance & Expiry Radar';
      case '/reports': return 'Reports';
      case '/audit-logs': return 'Audit Logs';
      case '/reminder-jobs': return 'Reminder Jobs';
      case '/system-settings': return 'System Settings';
      case '/notifications': return 'Notifications';
      case '/profile': return 'My Profile';
      default: return 'Dashboard';
    }
  };

  /** Check if the current route is forbidden for the current user */
  const isRouteForbidden = (path: string): boolean => {
    const guard = ROUTE_PERMISSIONS[path];
    if (!guard) return false; // Dashboard and unconfigured routes are open
    return !hasPermission(guard.module as any, guard.action as any);
  };

  const renderPage = () => {
    if (selectedContractId) {
      return <ContractDetailPage contractId={selectedContractId} onBack={() => setSelectedContractId(null)} />;
    }

    // Check for forbidden route
    if (currentPath !== '/dashboard' && isRouteForbidden(currentPath)) {
      return <AccessDeniedPage path={currentPath} />;
    }

    switch (currentPath) {
      case '/settings/users':
        return <UserManagementPage />;
      case '/vendors':
        return <VendorsListPage />;
      case '/contracts':
        return <ContractsListPage onSelectContract={(id) => setSelectedContractId(id)} />;
      case '/approvals':
      case '/approval-history':
        return <ApprovalsInboxPage />;
      case '/compliance':
        return <ComplianceRadarPage onSelectContract={(id) => setSelectedContractId(id)} />;
      case '/audit-logs':
        return <AuditLogsPage />;
      case '/reports':
        return <ReportsPage />;
      case '/reminder-jobs':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <Radar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-700 mb-1">Reminder Jobs</h3>
            <p className="text-sm">Job scheduler management coming soon.</p>
          </div>
        );
      case '/system-settings':
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <Lock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-700 mb-1">System Settings</h3>
            <p className="text-sm">Approval thresholds and SMTP configuration coming soon.</p>
          </div>
        );
      case '/dashboard':
      default:
        // Role-specific landing dashboard
        if (isAdmin) return <AdminDashboard onNavigate={handleNavigate} fetchHealth={fetchHealth} loading={loading} healthData={healthData} error={error} />;
        if (isProcurement) return <ProcurementDashboard onNavigate={handleNavigate} />;
        if (isLegal) return <LegalDashboard onNavigate={handleNavigate} />;
        if (isFinance) return <FinanceDashboard onNavigate={handleNavigate} />;
        if (isApprover) return <ApproverDashboard onNavigate={handleNavigate} />;
        return <ViewerDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={handleNavigate}
      pageTitle={getPageTitle()}
      systemStatus={systemStatus}
    >
      {renderPage()}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
