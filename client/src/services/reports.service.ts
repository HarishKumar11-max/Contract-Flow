import api from './api';

export interface AnalyticsData {
  summary: {
    totalContracts: number;
    totalSpend: number;
    activeVendors: number;
    pendingApprovals: number;
    approvedWorkflows: number;
    rejectedWorkflows: number;
    expiringIn30Days: number;
  };
  byStatus: Array<{ status: string; count: number; value: number }>;
  byType: Array<{ type: string; count: number; value: number }>;
  byDepartment: Array<{ department: string; count: number; value: number }>;
  monthlyTrend: Array<{ year: number; month: number; count: number; value: number }>;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const reportsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await api.get<AnalyticsData>('/reports/analytics');
    return res.data;
  },

  exportContracts: async (format: 'csv' | 'pdf' = 'csv', filters?: { status?: string; department?: string }): Promise<void> => {
    const res = await api.get('/reports/contracts/export', {
      params: { format, ...filters },
      responseType: 'blob',
    });
    const extension = format === 'pdf' ? 'pdf' : 'csv';
    triggerDownload(new Blob([res.data]), `contracts-export-${Date.now()}.${extension}`);
  },

  exportVendors: async (format: 'csv' = 'csv'): Promise<void> => {
    const res = await api.get('/reports/vendors/export', {
      params: { format },
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `vendors-export-${Date.now()}.csv`);
  },

  exportApprovals: async (format: 'csv' = 'csv'): Promise<void> => {
    const res = await api.get('/reports/approvals/export', {
      params: { format },
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `approvals-export-${Date.now()}.csv`);
  },
};
