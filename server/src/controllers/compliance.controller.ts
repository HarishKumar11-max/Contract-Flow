import { Request, Response } from 'express';
import { radarService } from '../services/radar.service';
import { Contract } from '../models/contract.model';
import { IUser } from '../models/user.model';
import { recordAuditLog } from '../utils/audit.util';
import { z } from 'zod';
import crypto from 'crypto';

const updateComplianceSchema = z.object({
  status: z.enum(['Compliant', 'Non-Compliant', 'Pending Review']),
  notes: z.string().optional(),
});

const addComplianceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional().default(''),
  dueDate: z.string().optional(),
});

export const complianceController = {
  getRadarMetrics: async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await radarService.getMetrics();
      res.json({ metrics });
    } catch (err: any) {
      console.error('[ComplianceController] getRadarMetrics error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  triggerSweep: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as IUser;
      const result = await radarService.runSweep();

      await recordAuditLog({
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
        action: 'UPDATE',
        entityType: 'System',
        entityId: 'radar-sweep',
        changes: { after: result },
      });

      res.json({
        message: 'Radar sweep completed successfully',
        result,
      });
    } catch (err: any) {
      console.error('[ComplianceController] triggerSweep error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  updateComplianceItem: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, itemId } = req.params;
      const user = req.user as IUser;

      const parsed = updateComplianceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'ValidationError',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        });
        return;
      }

      const { status } = parsed.data;

      const contract = await Contract.findById(id);
      if (!contract) {
        res.status(404).json({ error: 'NotFound', message: 'Contract not found' });
        return;
      }

      const item = contract.complianceItems.find((ci) => ci.id === itemId);
      if (!item) {
        res.status(404).json({ error: 'NotFound', message: 'Compliance requirement item not found' });
        return;
      }

      const prevStatus = item.status;
      item.status = status;
      item.verifiedBy = user._id as any;
      item.verifiedAt = new Date();

      await contract.save();

      await recordAuditLog({
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
        action: 'UPDATE',
        entityType: 'Contract',
        entityId: contract._id.toString(),
        changes: {
          before: { itemId, itemTitle: item.title, status: prevStatus },
          after: { itemId, itemTitle: item.title, status, verifiedBy: user.email, verifiedAt: item.verifiedAt },
        },
      });

      res.json({
        message: 'Compliance requirement status updated',
        item,
        complianceItems: contract.complianceItems,
      });
    } catch (err: any) {
      console.error('[ComplianceController] updateComplianceItem error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  addComplianceItem: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      const parsed = addComplianceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'ValidationError',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        });
        return;
      }

      const contract = await Contract.findById(id);
      if (!contract) {
        res.status(404).json({ error: 'NotFound', message: 'Contract not found' });
        return;
      }

      const newItem = {
        id: `comp-${crypto.randomUUID().slice(0, 8)}`,
        title: parsed.data.title,
        description: parsed.data.description,
        status: 'Pending Review' as const,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      };

      contract.complianceItems.push(newItem);
      await contract.save();

      await recordAuditLog({
        userId: user._id.toString(),
        userEmail: user.email,
        userRole: user.role,
        action: 'UPDATE',
        entityType: 'Contract',
        entityId: contract._id.toString(),
        changes: { after: { newItem } },
      });

      res.status(201).json({
        message: 'Compliance item added successfully',
        item: newItem,
        complianceItems: contract.complianceItems,
      });
    } catch (err: any) {
      console.error('[ComplianceController] addComplianceItem error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },
};
