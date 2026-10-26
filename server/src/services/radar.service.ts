import { Contract, IContract } from '../models/contract.model';
import { User, IUser } from '../models/user.model';
import { stateMachineService } from './stateMachine.service';
import { notificationService } from './notification.service';
import { recordAuditLog } from '../utils/audit.util';
import cron, { ScheduledTask } from 'node-cron';

export interface RadarSweepResult {
  timestamp: string;
  contractsEvaluated: number;
  transitionedToExpiringSoon: string[];
  transitionedToExpired: string[];
  notificationsGenerated: number;
  complianceAlertsGenerated: number;
}

export interface RadarMetrics {
  totalActive: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  expiredContracts: number;
  totalComplianceItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  pendingReviewItems: number;
  complianceRate: number;
  contractsAtRisk: any[];
}

let cronTask: ScheduledTask | null = null;

export const radarService = {
  /**
   * Runs an on-demand or scheduled Expiry & Compliance Radar Sweep
   */
  runSweep: async (): Promise<RadarSweepResult> => {
    const now = new Date();
    const result: RadarSweepResult = {
      timestamp: now.toISOString(),
      contractsEvaluated: 0,
      transitionedToExpiringSoon: [],
      transitionedToExpired: [],
      notificationsGenerated: 0,
      complianceAlertsGenerated: 0,
    };

    // Find all active or expiring soon contracts
    const candidateContracts = await Contract.find({
      status: { $in: ['Active', 'Expiring Soon'] },
    }).populate('ownerId', 'name email role');

    result.contractsEvaluated = candidateContracts.length;

    // Find admin users to alert for critical notifications
    const adminUsers = await User.find({ role: 'Admin', isActive: true }).select('_id');
    const adminIds = adminUsers.map((u) => u._id.toString());

    for (const contract of candidateContracts) {
      const endDate = new Date(contract.endDate);
      const noticeDays = contract.renewalNoticeDays || 30;
      const warningDate = new Date(endDate.getTime() - noticeDays * 24 * 60 * 60 * 1000);
      const ownerId = contract.ownerId ? (contract.ownerId as any)._id?.toString() || contract.ownerId.toString() : null;

      // 1. Check for Expired: now > endDate
      if (now > endDate) {
        if (contract.status === 'Expiring Soon') {
          await stateMachineService.validateAndExecute(contract, 'Expired');
          result.transitionedToExpired.push(contract.contractNumber);

          const recipients = Array.from(new Set([...(ownerId ? [ownerId] : []), ...adminIds]));
          if (recipients.length > 0) {
            await notificationService.createBroadcastNotification(recipients, {
              type: 'Contract Status Change',
              title: `Contract Expired: ${contract.contractNumber}`,
              message: `Contract "${contract.title}" passed its end date on ${endDate.toLocaleDateString()} and is now Expired.`,
              contractId: contract._id as any,
            });
            result.notificationsGenerated += recipients.length;
          }

          await recordAuditLog({
            userEmail: 'system@clm.local',
            userRole: 'System',
            action: 'STATUS_TRANSITION',
            entityType: 'Contract',
            entityId: contract._id.toString(),
            changes: { after: { status: 'Expired', trigger: 'Automated Radar Sweep' } },
          });
        } else if (contract.status === 'Active') {
          // If contract is active but already past end date, transition Active -> Expiring Soon -> Expired
          await stateMachineService.validateAndExecute(contract, 'Expiring Soon');
          await stateMachineService.validateAndExecute(contract, 'Expired');
          result.transitionedToExpired.push(contract.contractNumber);

          const recipients = Array.from(new Set([...(ownerId ? [ownerId] : []), ...adminIds]));
          if (recipients.length > 0) {
            await notificationService.createBroadcastNotification(recipients, {
              type: 'Contract Status Change',
              title: `Contract Expired: ${contract.contractNumber}`,
              message: `Contract "${contract.title}" reached its expiration date and is now Expired.`,
              contractId: contract._id as any,
            });
            result.notificationsGenerated += recipients.length;
          }
        }
        continue;
      }

      // 2. Check for Expiring Soon: now >= warningDate && now <= endDate
      if (contract.status === 'Active' && now >= warningDate && now <= endDate) {
        const msRemaining = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

        await stateMachineService.validateAndExecute(contract, 'Expiring Soon');
        result.transitionedToExpiringSoon.push(contract.contractNumber);

        const recipients = Array.from(new Set([...(ownerId ? [ownerId] : []), ...adminIds]));
        if (recipients.length > 0) {
          await notificationService.createBroadcastNotification(recipients, {
            type: 'Expiry Warning',
            title: `Expiry Radar Warning: ${contract.contractNumber}`,
            message: `Contract "${contract.title}" expires in ${daysRemaining} days on ${endDate.toLocaleDateString()}. Notice window: ${noticeDays} days.`,
            contractId: contract._id as any,
          });
          result.notificationsGenerated += recipients.length;
        }

        await recordAuditLog({
          userEmail: 'system@clm.local',
          userRole: 'System',
          action: 'STATUS_TRANSITION',
          entityType: 'Contract',
          entityId: contract._id.toString(),
          changes: { after: { status: 'Expiring Soon', trigger: 'Automated Radar Sweep' } },
        });
      }

      // 3. Check compliance items
      if (contract.complianceItems && contract.complianceItems.length > 0) {
        for (const item of contract.complianceItems) {
          if (item.status === 'Non-Compliant') {
            if (ownerId) {
              await notificationService.createNotification({
                recipientId: ownerId,
                type: 'Compliance Alert',
                title: `Compliance Breach: ${item.title}`,
                message: `Requirement "${item.title}" on contract ${contract.contractNumber} is marked Non-Compliant. Action required.`,
                contractId: contract._id as any,
              });
              result.complianceAlertsGenerated += 1;
            }
          }
        }
      }
    }

    return result;
  },

  /**
   * Returns radar analytics & KPIs across the contract repository
   */
  getMetrics: async (): Promise<RadarMetrics> => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [allContracts, expiredCount] = await Promise.all([
      Contract.find({ status: { $ne: 'Draft' } })
        .populate('vendorId', 'name code category')
        .populate('ownerId', 'name email role')
        .lean(),
      Contract.countDocuments({ status: 'Expired' }),
    ]);

    let totalActive = 0;
    let expiringIn30Days = 0;
    let expiringIn60Days = 0;
    let expiringIn90Days = 0;

    let totalComplianceItems = 0;
    let compliantItems = 0;
    let nonCompliantItems = 0;
    let pendingReviewItems = 0;

    const contractsAtRisk: any[] = [];

    for (const c of allContracts) {
      if (c.status === 'Active' || c.status === 'Expiring Soon') {
        totalActive += 1;
        const endDate = new Date(c.endDate);

        if (endDate > now && endDate <= thirtyDaysFromNow) {
          expiringIn30Days += 1;
          contractsAtRisk.push({
            ...c,
            riskReason: 'Expiring within 30 days',
            urgency: 'high',
          });
        } else if (endDate > now && endDate <= sixtyDaysFromNow) {
          expiringIn60Days += 1;
          contractsAtRisk.push({
            ...c,
            riskReason: 'Expiring within 60 days',
            urgency: 'medium',
          });
        } else if (endDate > now && endDate <= ninetyDaysFromNow) {
          expiringIn90Days += 1;
          contractsAtRisk.push({
            ...c,
            riskReason: 'Expiring within 90 days',
            urgency: 'low',
          });
        }
      }

      if (c.complianceItems && c.complianceItems.length > 0) {
        for (const item of c.complianceItems) {
          totalComplianceItems += 1;
          if (item.status === 'Compliant') compliantItems += 1;
          else if (item.status === 'Non-Compliant') {
            nonCompliantItems += 1;
            if (!contractsAtRisk.some((r) => r._id.toString() === c._id.toString())) {
              contractsAtRisk.push({
                ...c,
                riskReason: `Compliance breach: ${item.title}`,
                urgency: 'critical',
              });
            }
          } else if (item.status === 'Pending Review') {
            pendingReviewItems += 1;
          }
        }
      }
    }

    const complianceRate =
      totalComplianceItems > 0
        ? Math.round((compliantItems / totalComplianceItems) * 1000) / 10
        : 100;

    return {
      totalActive,
      expiringIn30Days,
      expiringIn60Days,
      expiringIn90Days,
      expiredContracts: expiredCount,
      totalComplianceItems,
      compliantItems,
      nonCompliantItems,
      pendingReviewItems,
      complianceRate,
      contractsAtRisk,
    };
  },

  /**
   * Initializes background cron schedule (runs daily at midnight)
   */
  startCron: (scheduleExpression = '0 0 * * *'): void => {
    if (cronTask) {
      cronTask.stop();
    }
    cronTask = cron.schedule(scheduleExpression, async () => {
      console.log('[RadarService] Starting scheduled expiry and compliance radar sweep...');
      try {
        const sweepResult = await radarService.runSweep();
        console.log('[RadarService] Scheduled sweep completed:', sweepResult);
      } catch (err) {
        console.error('[RadarService] Error running scheduled sweep:', err);
      }
    });
    console.log(`[RadarService] Expiry radar cron scheduled with expression: ${scheduleExpression}`);
  },

  stopCron: (): void => {
    if (cronTask) {
      cronTask.stop();
      cronTask = null;
    }
  },
};
