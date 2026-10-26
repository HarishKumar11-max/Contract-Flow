import { Request, Response } from 'express';
import { approvalService, ApprovalError } from '../services/approval.service';
import { ApprovalWorkflow } from '../models/approval.model';
import { IUser } from '../models/user.model';
import { z } from 'zod';

const takeActionSchema = z.object({
  action: z.enum(['Approve', 'Reject']),
  comments: z.string().optional(),
});

export const approvalController = {
  /**
   * POST /api/approvals
   * Initiates an approval workflow for a contract.
   * Body: { contractId: string }
   */
  initiateApproval: async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.body;
      if (!contractId) {
        res.status(400).json({ error: 'ValidationError', message: 'contractId is required' });
        return;
      }

      const actor = req.user as IUser;
      const workflow = await approvalService.initiateWorkflow(contractId, actor);

      res.status(201).json({
        message: 'Approval workflow initiated successfully',
        workflow,
      });
    } catch (err: any) {
      if (err instanceof ApprovalError) {
        res.status(err.statusCode).json({ error: err.name, message: err.message });
        return;
      }
      console.error('[ApprovalController] initiateApproval error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  /**
   * GET /api/approvals/inbox
   * Returns all in-progress workflows where the current user's role is required at the current step.
   */
  getMyPendingApprovals: async (req: Request, res: Response): Promise<void> => {
    try {
      const actor = req.user as IUser;

      // Admins see everything in inbox; role-specific users see their pending steps
      const workflows = await ApprovalWorkflow.find({ status: 'In Progress' })
        .populate('contractId', 'contractNumber title value currency status type department')
        .populate('initiatedBy', 'name email role')
        .lean();

      const myWorkflows = workflows.filter((wf) => {
        const currentStep = wf.steps[wf.currentStepIndex];
        if (!currentStep || currentStep.status !== 'Pending') return false;
        return actor.role === 'Admin' || actor.role === currentStep.roleRequired;
      });

      res.json({
        count: myWorkflows.length,
        workflows: myWorkflows,
      });
    } catch (err: any) {
      console.error('[ApprovalController] getMyPendingApprovals error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  /**
   * GET /api/approvals/contract/:contractId
   * Returns the active (In Progress) or latest workflow for a contract.
   */
  getWorkflowByContractId: async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.contractId as string;

      const workflow = await ApprovalWorkflow.findOne({ contractId })
        .sort({ createdAt: -1 })
        .populate('initiatedBy', 'name email role')
        .populate('steps.actedBy', 'name email role')
        .lean();

      if (!workflow) {
        res.status(404).json({ error: 'NotFound', message: 'No approval workflow found for this contract' });
        return;
      }

      res.json({ workflow });
    } catch (err: any) {
      console.error('[ApprovalController] getWorkflowByContractId error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  /**
   * GET /api/approvals
   * Returns all workflows (history) with contract populated. Admin/Legal only.
   */
  getWorkflowHistory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [workflows, total] = await Promise.all([
        ApprovalWorkflow.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('contractId', 'contractNumber title value currency status department type')
          .populate('initiatedBy', 'name email role')
          .populate('steps.actedBy', 'name email role')
          .lean(),
        ApprovalWorkflow.countDocuments(filter),
      ]);

      res.json({
        workflows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      console.error('[ApprovalController] getWorkflowHistory error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },

  /**
   * PATCH /api/approvals/:id/action
   * Approve or Reject the current step of a workflow.
   * Body: { action: 'Approve' | 'Reject', comments?: string }
   */
  takeAction: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      const parsed = takeActionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'ValidationError',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        });
        return;
      }

      const { action, comments } = parsed.data;
      const actor = req.user as IUser;

      const { workflow, contract } = await approvalService.takeAction(id, actor, action, comments);

      res.json({
        message: `Step ${action}d successfully`,
        workflow,
        contract: {
          _id: contract._id,
          contractNumber: contract.contractNumber,
          status: contract.status,
        },
      });
    } catch (err: any) {
      if (err instanceof ApprovalError) {
        res.status(err.statusCode).json({ error: err.name, message: err.message });
        return;
      }
      console.error('[ApprovalController] takeAction error:', err);
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  },
};
