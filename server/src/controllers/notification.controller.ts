import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { IUser } from '../models/user.model';

export const notificationController = {
  getMyNotifications: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as IUser;
      const unreadOnly = req.query.unread === 'true';
      const limit = parseInt(req.query.limit as string, 10) || 30;
      const page = parseInt(req.query.page as string, 10) || 1;

      const data = await notificationService.getUserNotifications(user._id.toString(), {
        unreadOnly,
        limit,
        page,
      });

      res.json(data);
    } catch (err: any) {
      console.error('[NotificationController] getMyNotifications error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  getUnreadCount: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as IUser;
      const unreadCount = await notificationService.getUnreadCount(user._id.toString());
      res.json({ unreadCount });
    } catch (err: any) {
      console.error('[NotificationController] getUnreadCount error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  markAsRead: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as IUser;
      const id = req.params.id as string;

      const notification = await notificationService.markAsRead(id, user._id.toString());
      if (!notification) {
        res.status(404).json({ error: 'NotFound', message: 'Notification not found' });
        return;
      }

      res.json({ message: 'Marked as read', notification });
    } catch (err: any) {
      console.error('[NotificationController] markAsRead error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  markAllAsRead: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as IUser;
      const modifiedCount = await notificationService.markAllAsRead(user._id.toString());
      res.json({ message: 'All notifications marked as read', modifiedCount });
    } catch (err: any) {
      console.error('[NotificationController] markAllAsRead error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },
};
