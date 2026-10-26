import mongoose from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model';

export interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  contractId?: string | mongoose.Types.ObjectId;
}

export const notificationService = {
  createNotification: async (params: CreateNotificationParams): Promise<INotification> => {
    return await Notification.create({
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      contractId: params.contractId,
      isRead: false,
    });
  },

  createBroadcastNotification: async (
    recipientIds: (string | mongoose.Types.ObjectId)[],
    data: Omit<CreateNotificationParams, 'recipientId'>
  ): Promise<INotification[]> => {
    const docs = recipientIds.map((id) => ({
      recipientId: id,
      type: data.type,
      title: data.title,
      message: data.message,
      contractId: data.contractId,
      isRead: false,
    }));
    return (await Notification.insertMany(docs)) as unknown as INotification[];
  },

  getUserNotifications: async (
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; page?: number } = {}
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> => {
    const query: Record<string, any> = { recipientId: userId };
    if (options.unreadOnly) {
      query.isRead = false;
    }

    const limit = options.limit || 30;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('contractId', 'contractNumber title status endDate value currency')
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return {
      notifications: notifications as unknown as INotification[],
      total,
      unreadCount,
    };
  },

  markAsRead: async (notificationId: string, userId: string): Promise<INotification | null> => {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
  },

  markAllAsRead: async (userId: string): Promise<number> => {
    const res = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.modifiedCount;
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    return await Notification.countDocuments({ recipientId: userId, isRead: false });
  },
};
