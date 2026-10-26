import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, PermissionMap, ModuleName, ActionName } from '../types/auth.types';
import { authService } from '../services/auth.service';

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Sarah Connor',
    email: 'admin@clm.local',
    password: 'Admin123!',
    role: 'Admin',
    description: 'Full administrative access and user management',
  },
  {
    name: 'Elena Rostova',
    email: 'legal@clm.local',
    password: 'Legal123!',
    role: 'Legal',
    description: 'Contract reviews, compliance, and legal approvals',
  },
  {
    name: 'Marcus Vance',
    email: 'procurement@clm.local',
    password: 'Procure123!',
    role: 'Procurement',
    description: 'Vendor management, contracts drafting & execution',
  },
  {
    name: 'David Sterling',
    email: 'finance@clm.local',
    password: 'Finance123!',
    role: 'Finance',
    description: 'Financial reviews, tier-2 approvals, and reports',
  },
  {
    name: 'Claire Underwood',
    email: 'approver@clm.local',
    password: 'Approve123!',
    role: 'Approver',
    description: 'Executive tier-3 contract sign-off',
  },
  {
    name: 'Tom Reynolds',
    email: 'viewer@clm.local',
    password: 'Viewer123!',
    role: 'Viewer',
    description: 'Read-only visibility across contracts and metrics',
  },
];

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  permissions: PermissionMap;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: ModuleName, action: ActionName) => boolean;
  isAdmin: boolean;
  isLegal: boolean;
  isProcurement: boolean;
  isFinance: boolean;
  isApprover: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clm_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('clm_auth_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.user);
          setToken(storedToken);
          setPermissions(res.permissions || {});
          setDemoMode(res.demoMode ?? false);
        } catch {
          localStorage.removeItem('clm_auth_token');
          setUser(null);
          setToken(null);
          setPermissions({});
        }
      } else {
        // Auto-login as Admin on first load (development convenience)
        try {
          const res = await authService.login('admin@clm.local', 'Admin123!');
          setUser(res.user);
          setToken(res.token);
          setPermissions(res.permissions || {});
          setDemoMode(res.demoMode ?? false);
          localStorage.setItem('clm_auth_token', res.token);
        } catch {
          // If server is not ready yet, keep state empty
          setUser(null);
          setToken(null);
          setPermissions({});
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.login(email, password);
      setUser(res.user);
      setToken(res.token);
      setPermissions(res.permissions || {});
      setDemoMode(res.demoMode ?? false);
      localStorage.setItem('clm_auth_token', res.token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickSwitchRole = async (targetRole: UserRole) => {
    const demo = DEMO_ACCOUNTS.find((a) => a.role === targetRole);
    if (demo) {
      await login(demo.email, demo.password);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setPermissions({});
      localStorage.removeItem('clm_auth_token');
    }
  };

  /**
   * Deny-by-default permission check using the server-returned permissions map.
   * Never rely on frontend checks alone — always verify server-side too.
   */
  const hasPermission = (module: ModuleName, action: ActionName): boolean => {
    const moduleActions = permissions[module];
    if (!moduleActions || !Array.isArray(moduleActions)) return false;
    return moduleActions.includes(action);
  };

  // Convenience role flags
  const role = user?.role;
  const isAdmin = role === 'Admin';
  const isLegal = role === 'Legal';
  const isProcurement = role === 'Procurement';
  const isFinance = role === 'Finance';
  const isApprover = role === 'Approver';
  const isViewer = role === 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        permissions,
        demoMode,
        login,
        quickSwitchRole,
        logout,
        hasPermission,
        isAdmin,
        isLegal,
        isProcurement,
        isFinance,
        isApprover,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
