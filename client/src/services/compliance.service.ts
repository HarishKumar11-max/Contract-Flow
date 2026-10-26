import apiClient from './api';
import {
  RadarMetrics,
  RadarSweepResult,
  IComplianceItem,
  ComplianceItemStatus,
} from '../types/compliance.types';

export const complianceService = {
  getRadarMetrics: async (): Promise<RadarMetrics> => {
    const res = await apiClient.get<{ metrics: RadarMetrics }>('/compliance/radar');
    return res.data.metrics;
  },

  triggerSweep: async (): Promise<RadarSweepResult> => {
    const res = await apiClient.post<{ message: string; result: RadarSweepResult }>(
      '/compliance/sweep'
    );
    return res.data.result;
  },

  updateComplianceStatus: async (
    contractId: string,
    itemId: string,
    status: ComplianceItemStatus,
    notes?: string
  ): Promise<{ item: IComplianceItem; complianceItems: IComplianceItem[] }> => {
    const res = await apiClient.patch<{
      message: string;
      item: IComplianceItem;
      complianceItems: IComplianceItem[];
    }>(`/compliance/contracts/${contractId}/items/${itemId}`, { status, notes });
    return res.data;
  },

  addComplianceItem: async (
    contractId: string,
    payload: { title: string; description?: string; dueDate?: string }
  ): Promise<{ item: IComplianceItem; complianceItems: IComplianceItem[] }> => {
    const res = await apiClient.post<{
      message: string;
      item: IComplianceItem;
      complianceItems: IComplianceItem[];
    }>(`/compliance/contracts/${contractId}/items`, payload);
    return res.data;
  },
};
