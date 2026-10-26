import api from './api';

export interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

export const auditService = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    entityType?: string;
    action?: string;
    userEmail?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogsResponse> => {
    const res = await api.get<AuditLogsResponse>('/audit-logs', { params });
    return res.data;
  },

  exportAuditLogs: async (filters?: {
    entityType?: string;
    action?: string;
    userEmail?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> => {
    const res = await api.get('/audit-logs/export', {
      params: filters,
      responseType: 'blob',
    });
    triggerDownload(new Blob([res.data]), `audit-logs-export-${Date.now()}.csv`);
  },
};
