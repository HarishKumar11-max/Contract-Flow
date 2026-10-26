import api from './api';
import { Vendor, VendorListResponse } from '../types/vendor.types';

export const vendorService = {
  getVendors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    riskScore?: string;
    status?: string;
  }): Promise<VendorListResponse> => {
    const res = await api.get<VendorListResponse>('/vendors', { params });
    return res.data;
  },

  getVendorById: async (id: string): Promise<{ vendor: Vendor }> => {
    const res = await api.get<{ vendor: Vendor }>(`/vendors/${id}`);
    return res.data;
  },

  createVendor: async (data: Partial<Vendor>): Promise<{ message: string; vendor: Vendor }> => {
    const res = await api.post('/vendors', data);
    return res.data;
  },

  updateVendor: async (id: string, data: Partial<Vendor>): Promise<{ message: string; vendor: Vendor }> => {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data;
  },

  updateRating: async (id: string, rating: number): Promise<{ message: string; vendor: Vendor }> => {
    const res = await api.patch(`/vendors/${id}/rating`, { rating });
    return res.data;
  },

  deleteVendor: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/vendors/${id}`);
    return res.data;
  },
};
