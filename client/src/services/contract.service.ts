import api from './api';
import { Contract, ContractListResponse, ContractStatus } from '../types/contract.types';

export const contractService = {
  getContracts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorId?: string;
    type?: string;
    department?: string;
  }): Promise<ContractListResponse> => {
    const res = await api.get<ContractListResponse>('/contracts', { params });
    return res.data;
  },

  getContractById: async (
    id: string
  ): Promise<{ contract: Contract; allowedTransitions: ContractStatus[] }> => {
    const res = await api.get<{ contract: Contract; allowedTransitions: ContractStatus[] }>(
      `/contracts/${id}`
    );
    return res.data;
  },

  createContract: async (data: any): Promise<{ message: string; contract: Contract }> => {
    const res = await api.post('/contracts', data);
    return res.data;
  },

  updateContract: async (id: string, data: any): Promise<{ message: string; contract: Contract }> => {
    const res = await api.put(`/contracts/${id}`, data);
    return res.data;
  },

  deleteContract: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/contracts/${id}`);
    return res.data;
  },

  transitionState: async (
    id: string,
    targetStatus: ContractStatus,
    notes?: string
  ): Promise<{ message: string; contract: Contract; allowedTransitions: ContractStatus[] }> => {
    const res = await api.patch(`/contracts/${id}/transition`, { targetStatus, notes });
    return res.data;
  },

  uploadDocument: async (
    id: string,
    file: File,
    notes?: string
  ): Promise<{ message: string; document: any; currentVersion: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) formData.append('notes', notes);

    const res = await api.post(`/contracts/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getDocumentDownloadUrl: (contractId: string, docId: string): string => {
    return `/api/contracts/${contractId}/documents/${docId}/download`;
  },
};
