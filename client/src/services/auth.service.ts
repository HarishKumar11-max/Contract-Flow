import api from './api';
import { AuthResponse, AuthUser, UserListResponse, UserRole, PermissionMap } from '../types/auth.types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('clm_auth_token', res.data.token);
    }
    return res.data;
  },

  getMe: async (): Promise<{ user: AuthUser; permissions: PermissionMap; demoMode: boolean }> => {
    const res = await api.get<{ user: AuthUser; permissions: PermissionMap; demoMode: boolean }>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('clm_auth_token');
    }
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<UserListResponse> => {
    const res = await api.get<UserListResponse>('/users', { params });
    return res.data;
  },

  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department: string;
  }): Promise<{ message: string; user: AuthUser }> => {
    const res = await api.post('/users', userData);
    return res.data;
  },

  toggleUserStatus: async (userId: string): Promise<{ message: string; isActive: boolean }> => {
    const res = await api.patch(`/users/${userId}/status`);
    return res.data;
  },
};
