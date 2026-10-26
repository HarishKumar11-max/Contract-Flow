import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';
import { IUser } from '../models/user.model';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  tier1Threshold: z.number().min(0).optional(),
  tier2Threshold: z.number().min(0).optional(),
  reminderNoticeDays: z.array(z.number()).optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
});

export const settingsController = {
  getSettings: async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await settingsService.getSettings();
      res.json({ settings });
    } catch (err: any) {
      console.error('[SettingsController] getSettings error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  updateSettings: async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'ValidationError',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        });
        return;
      }

      const user = req.user as IUser;
      const settings = await settingsService.updateSettings(parsed.data, user);

      res.json({
        message: 'System settings updated successfully',
        settings,
      });
    } catch (err: any) {
      console.error('[SettingsController] updateSettings error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },
};
