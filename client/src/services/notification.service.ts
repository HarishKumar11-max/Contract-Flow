import apiClient from './api';
import { NotificationListResponse, INotification } from '../types/notification.types';

export const notificationService = {
  getMyNotifications: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications', {
      params: {
        unread: params?.unreadOnly ? 'true' : 'false',
        page: params?.page || 1,
        limit: params?.limit || 20,
      },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  markAsRead: async (id: string): Promise<INotification> => {
    const res = await apiClient.patch<{ message: string; notification: INotification }>(
      `/notifications/${id}/read`
    );
    return res.data.notification;
  },

  markAllAsRead: async (): Promise<number> => {
    const res = await apiClient.patch<{ message: string; modifiedCount: number }>(
      '/notifications/read-all'
    );
    return res.data.modifiedCount;
  },
};
