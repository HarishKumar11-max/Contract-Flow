import { SystemSettings, ISystemSettings } from '../models/settings.model';
import { IUser } from '../models/user.model';
import { recordAuditLog } from '../utils/audit.util';

export const settingsService = {
  getSettings: async (): Promise<ISystemSettings> => {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        tier1Threshold: 25000,
        tier2Threshold: 100000,
        reminderNoticeDays: [30, 60, 90],
        smtpHost: 'smtp.mailtrap.io',
        smtpPort: 587,
        smtpUser: 'clm-system-mailer',
      });
    }
    return settings;
  },

  updateSettings: async (
    updates: Partial<{
      tier1Threshold: number;
      tier2Threshold: number;
      reminderNoticeDays: number[];
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
    }>,
    actor: IUser
  ): Promise<ISystemSettings> => {
    const settings = await settingsService.getSettings();
    const prev = settings.toObject();

    if (updates.tier1Threshold !== undefined) settings.tier1Threshold = updates.tier1Threshold;
    if (updates.tier2Threshold !== undefined) settings.tier2Threshold = updates.tier2Threshold;
    if (updates.reminderNoticeDays !== undefined) settings.reminderNoticeDays = updates.reminderNoticeDays;
    if (updates.smtpHost !== undefined) settings.smtpHost = updates.smtpHost;
    if (updates.smtpPort !== undefined) settings.smtpPort = updates.smtpPort;
    if (updates.smtpUser !== undefined) settings.smtpUser = updates.smtpUser;
    settings.updatedBy = actor._id as any;

    await settings.save();

    await recordAuditLog({
      userId: actor._id.toString(),
      userEmail: actor.email,
      userRole: actor.role,
      action: 'UPDATE',
      entityType: 'System',
      entityId: settings._id.toString(),
      changes: {
        before: {
          tier1Threshold: prev.tier1Threshold,
          tier2Threshold: prev.tier2Threshold,
        },
        after: {
          tier1Threshold: settings.tier1Threshold,
          tier2Threshold: settings.tier2Threshold,
        },
      },
    });

    return settings;
  },
};
