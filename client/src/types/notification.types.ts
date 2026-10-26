export type NotificationType =
  | 'Renewal Reminder'
  | 'Expiry Warning'
  | 'Approval Request'
  | 'Approval Decision'
  | 'Contract Status Change'
  | 'Compliance Alert';

export interface INotification {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  contractId?: {
    _id: string;
    contractNumber: string;
    title: string;
    status: string;
    endDate: string;
    value: number;
    currency: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: INotification[];
  total: number;
  unreadCount: number;
}
