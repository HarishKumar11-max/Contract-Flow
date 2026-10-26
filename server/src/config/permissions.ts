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
  [role in UserRole]: {
    [module in ModuleName]?: ActionName[];
  };
};

/**
 * Central Permission Matrix
 * Deny-by-default: An action is only permitted if explicitly defined in this map.
 */
export const ROLE_PERMISSIONS: PermissionMap = {
  Admin: {
    users: ['create', 'read', 'update', 'delete'],
    contracts: ['create', 'read', 'update', 'delete', 'submit', 'export'],
    documents: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete', 'export'],
    approvals: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'submit', 'export'],
    compliance: ['create', 'read', 'update', 'delete', 'export'],
    reports: ['create', 'read', 'update', 'delete', 'export'],
    'audit-logs': ['read', 'export'],
    'reminder-jobs': ['create', 'read', 'update', 'delete', 'run-job'],
    settings: ['create', 'read', 'update', 'delete'],
    notifications: ['create', 'read', 'update', 'delete'],
    profile: ['read', 'update'],
  },
  Procurement: {
    contracts: ['create', 'read', 'update', 'delete', 'submit'], // Record-level: own contracts only, Draft/Rejected
    documents: ['create', 'read', 'delete'], // Record-level: own contracts only
    vendors: ['create', 'read', 'update'], // Cannot delete or blacklist
    approvals: ['read', 'submit'], // Submit own contracts, withdraw, view own history
    compliance: ['read'], // Read-only on compliance
    reports: ['read', 'export'], // Own scope
    notifications: ['read', 'update'],
    profile: ['read', 'update'],
  },
  Legal: {
    contracts: ['read'], // Read all contracts, cannot create, edit or delete
    documents: ['read'],
    compliance: ['create', 'read', 'update'], // Full create and update on compliance
    approvals: ['read', 'approve', 'reject'], // Legal steps on assigned contracts, all tiers
    reports: ['read', 'export'], // Own scope
    notifications: ['read', 'update'],
    profile: ['read', 'update'],
  },
  Finance: {
    contracts: ['read'], // Read all contracts including values
    documents: ['read'], // Read/download contract documents
    vendors: ['read'], // Read-only
    approvals: ['read', 'approve', 'reject'], // Finance steps for Tier 2 and Tier 3 after Legal step
    compliance: ['read'], // Read-only on compliance
    reports: ['read', 'export'], // Financial scope
    notifications: ['read', 'update'],
    profile: ['read', 'update'],
  },
  Approver: {
    contracts: ['read'], // Assigned contracts (read-only)
    documents: ['read'], // Read/download contract documents
    approvals: ['read', 'approve', 'reject'], // Final Tier 3 sign-off after Legal and Finance
    reports: ['read', 'export'], // Own decisions and turnaround
    notifications: ['read', 'update'],
    profile: ['read', 'update'],
  },
  Viewer: {
    contracts: ['read'], // Read-only
    documents: ['read'], // Read/download contract documents
    vendors: ['read'], // Read-only
    compliance: ['read'], // Read-only
    approvals: ['read'], // Read-only
    'audit-logs': ['read'], // Viewable but never editable or exportable
    notifications: ['read', 'update'],
    profile: ['read', 'update'],
  },
};

/**
 * Deny-by-default permission check
 */
export const hasPermission = (
  role: UserRole | undefined,
  module: ModuleName,
  action: ActionName
): boolean => {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  const moduleActions = ROLE_PERMISSIONS[role][module];
  if (!moduleActions || !Array.isArray(moduleActions)) {
    return false;
  }
  return moduleActions.includes(action);
};
