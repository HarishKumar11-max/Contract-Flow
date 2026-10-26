export type UserRole = 'Admin' | 'Legal' | 'Procurement' | 'Finance' | 'Approver' | 'Viewer';

export type ModuleName =
  | 'users'
  | 'contracts'
  | 'documents'
  | 'vendors'
  | 'approvals'
  | 'compliance'
  | 'reports'
  | 'audit-logs'
  | 'reminder-jobs'
  | 'settings'
  | 'notifications'
  | 'profile';

export type ActionName =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'submit'
  | 'export'
  | 'run-job';

export type PermissionMap = {
  [module in ModuleName]?: ActionName[];
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
  permissions: PermissionMap;
  demoMode: boolean;
}

export interface UserListResponse {
  users: AuthUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
