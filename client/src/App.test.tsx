import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import App from './App';

const adminPermissions = {
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
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn((url: string) => {
        if (url.includes('/reports/analytics')) {
          return Promise.resolve({
            data: {
              summary: {
                totalContracts: 5,
                totalSpend: 350000,
                activeVendors: 4,
                pendingApprovals: 2,
                approvedWorkflows: 3,
                rejectedWorkflows: 0,
                expiringIn30Days: 1,
              },
              byStatus: [{ status: 'Active', count: 3, value: 250000 }],
              byType: [{ type: 'MSA', count: 2, value: 200000 }],
              byDepartment: [{ department: 'Engineering', count: 2, value: 180000 }],
              monthlyTrend: [],
            },
          });
        }
        if (url.includes('/audit-logs')) {
          return Promise.resolve({
            data: {
              logs: [
                {
                  _id: 'log-1',
                  userEmail: 'admin@clm.local',
                  userRole: 'Admin',
                  action: 'CREATE',
                  entityType: 'Contract',
                  entityId: 'CTR-2026-0001',
                  changes: { after: { title: 'AWS Cloud Agreement' } },
                  timestamp: '2026-10-15T00:00:00.000Z',
                },
              ],
              pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
            },
          });
        }
        if (url.includes('/compliance/radar')) {
          return Promise.resolve({
            data: {
              metrics: {
                totalActive: 4,
                expiringIn30Days: 1,
                expiringIn60Days: 1,
                expiringIn90Days: 0,
                expiredContracts: 1,
                totalComplianceItems: 5,
                compliantItems: 4,
                nonCompliantItems: 1,
                pendingReviewItems: 0,
                complianceRate: 80,
                contractsAtRisk: [
                  {
                    _id: 'c-risk-1',
                    contractNumber: 'CTR-2026-0005',
                    title: 'Office Cloud Subscription',
                    status: 'Expiring Soon',
                    value: 15000,
                    currency: 'INR',
                    startDate: '2025-01-01',
                    endDate: '2026-11-01',
                    renewalType: 'Manual Review',
                    renewalNoticeDays: 30,
                    department: 'IT',
                    vendorId: { name: 'Microsoft Corporation', code: 'VEND-MS-002' },
                    riskReason: 'Expiring within 30 days',
                    urgency: 'high',
                    complianceItems: [
                      { id: 'ci-1', title: 'Data Privacy Addendum', status: 'Compliant' },
                    ],
                  },
                ],
              },
            },
          });
        }
        if (url.includes('/notifications/unread-count')) {
          return Promise.resolve({ data: { unreadCount: 2 } });
        }
        if (url.includes('/notifications')) {
          return Promise.resolve({
            data: {
              notifications: [
                {
                  _id: 'notif-1',
                  type: 'Expiry Warning',
                  title: 'Expiry Radar Warning: CTR-2026-0005',
                  message: 'Contract expires in 15 days.',
                  isRead: false,
                  createdAt: '2026-10-15T00:00:00.000Z',
                },
              ],
              total: 1,
              unreadCount: 1,
            },
          });
        }
        if (url.includes('/approvals/inbox')) {
          return Promise.resolve({
            data: {
              count: 1,
              workflows: [
                {
                  _id: 'wf-1',
                  contractId: {
                    _id: 'c1',
                    contractNumber: 'CTR-2026-0001',
                    title: 'AWS Enterprise Cloud Compute Agreement',
                    value: 180000,
                    currency: 'INR',
                    status: 'Pending Approval',
                    type: 'MSA',
                    department: 'Engineering',
                  },
                  currentStepIndex: 0,
                  status: 'In Progress',
                  steps: [
                    { _id: 's1', stepNumber: 1, roleRequired: 'Legal', status: 'Pending' },
                    { _id: 's2', stepNumber: 2, roleRequired: 'Finance', status: 'Pending' },
                    { _id: 's3', stepNumber: 3, roleRequired: 'Approver', status: 'Pending' },
                  ],
                  initiatedBy: { _id: 'u1', name: 'Sarah Connor', email: 'admin@clm.local', role: 'Admin' },
                  createdAt: '2026-01-01T00:00:00.000Z',
                  updatedAt: '2026-01-01T00:00:00.000Z',
                },
              ],
            },
          });
        }
        if (url.includes('/contracts')) {
          return Promise.resolve({
            data: {
              contracts: [
                {
                  _id: 'c1',
                  contractNumber: 'CTR-2026-0001',
                  title: 'AWS Enterprise Cloud Compute Agreement',
                  type: 'MSA',
                  vendorId: { name: 'Amazon Web Services Inc.', code: 'VEND-AWS-001' },
                  status: 'In Review',
                  value: 180000,
                  currency: 'INR',
                  startDate: '2026-01-01',
                  endDate: '2027-01-01',
                  renewalType: 'Auto-Renew',
                  renewalNoticeDays: 30,
                  tags: ['Cloud'],
                },
              ],
              pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
              metrics: {
                totalContracts: 1,
                activeContracts: 0,
                inReviewContracts: 1,
                expiringSoonContracts: 0,
                totalContractValue: 180000,
              },
            },
          });
        }
        if (url.includes('/vendors')) {
          return Promise.resolve({
            data: {
              vendors: [
                {
                  _id: 'v1',
                  name: 'Amazon Web Services Inc.',
                  code: 'VEND-AWS-001',
                  category: 'Software/SaaS',
                  contactPerson: { name: 'Michael Chen', email: 'mchen@amazon.com' },
                  status: 'Active',
                  performanceRating: 4.8,
                  riskScore: 'Low',
                },
              ],
              pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
              metrics: { totalVendors: 1, activeVendors: 1, highRiskVendors: 0, avgPerformanceRating: 4.8 },
            },
          });
        }
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            data: {
              user: {
                id: '1',
                name: 'Sarah Connor',
                email: 'admin@clm.local',
                role: 'Admin',
                department: 'Administration',
              },
              permissions: adminPermissions,
              demoMode: true,
            },
          });
        }
        return Promise.resolve({
          data: {
            status: 'ok',
            message: 'API operational',
            timestamp: '2026-10-14T19:00:00.000Z',
            uptime: 120,
            environment: 'test',
            database: { status: 'connected', readyState: 1, name: 'contractflow' },
          },
        });
      }),
      post: vi.fn((url: string) => {
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            data: {
              token: 'mock-jwt-token-12345',
              user: {
                id: '1',
                name: 'Sarah Connor',
                email: 'admin@clm.local',
                role: 'Admin',
                department: 'Administration',
              },
              permissions: adminPermissions,
              demoMode: true,
            },
          });
        }
        if (url.includes('/compliance/sweep')) {
          return Promise.resolve({
            data: {
              message: 'Radar sweep completed successfully',
              result: {
                timestamp: '2026-10-15T00:00:00.000Z',
                contractsEvaluated: 4,
                transitionedToExpiringSoon: ['CTR-2026-0005'],
                transitionedToExpired: [],
                notificationsGenerated: 2,
                complianceAlertsGenerated: 0,
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      }),
      patch: vi.fn(() => Promise.resolve({ data: { message: 'success' } })),
      delete: vi.fn(() => Promise.resolve({ data: { message: 'deleted' } })),
    })),
    get: vi.fn(() =>
      Promise.resolve({
        data: {
          status: 'ok',
          message: 'API operational',
          timestamp: '2026-10-14T19:00:00.000Z',
          uptime: 120,
          environment: 'test',
          database: { status: 'connected', readyState: 1, name: 'contractflow' },
        },
      })
    ),
  },
}));

describe('ContractFlow Core UI & Role-Specific Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders branding and clean Admin Dashboard', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('ContractFlow')).toBeInTheDocument();
      expect(screen.getByText('Administration Dashboard')).toBeInTheDocument();
    });
  });

  it('navigates to Compliance Radar and displays telemetry', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Administration Dashboard')).toBeInTheDocument();
    });

    const complianceBtn = screen.getAllByText('Compliance')[0].closest('button')!;
    fireEvent.click(complianceBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Compliance & Expiry Radar').length).toBeGreaterThan(0);
      expect(screen.getByText('Execute Live Radar Sweep')).toBeInTheDocument();
      expect(screen.getByText('Active Monitored')).toBeInTheDocument();
      expect(screen.getByText('Office Cloud Subscription')).toBeInTheDocument();
    });
  });

  it('navigates to Executive Reports & Analytics and displays KPI metrics', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Administration Dashboard')).toBeInTheDocument();
    });

    const reportsLinks = screen.getAllByRole('button', { name: /reports/i });
    fireEvent.click(reportsLinks[0]);

    await waitFor(() => {
      expect(screen.getByText('Executive Reports & Analytics')).toBeInTheDocument();
      expect(screen.getByText('Total Contract Value')).toBeInTheDocument();
      expect(screen.getByText('Export Reports & Data')).toBeInTheDocument();
    });
  });

  it('navigates to Audit Trail and displays logs', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Administration Dashboard')).toBeInTheDocument();
    });

    const auditLinks = screen.getAllByRole('button', { name: /audit logs/i });
    fireEvent.click(auditLinks[0]);

    await waitFor(() => {
      expect(screen.getByText('Immutable Audit Trail')).toBeInTheDocument();
      expect(screen.getByText('admin@clm.local')).toBeInTheDocument();
    });
  });
});
