import { Router } from 'express';
import { approvalController } from '../controllers/approval.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// All approval routes require authentication
router.use(authenticate);

// POST /api/approvals — initiate a workflow; Procurement can submit own contracts
router.post(
  '/',
  authorize('approvals', 'submit'),
  approvalController.initiateApproval
);

// GET /api/approvals/inbox — current user's pending actions (all roles with approvals:read)
router.get('/inbox', authorize('approvals', 'read'), approvalController.getMyPendingApprovals);

// GET /api/approvals/contract/:contractId — workflow for a specific contract
router.get('/contract/:contractId', authorize('approvals', 'read'), approvalController.getWorkflowByContractId);

// GET /api/approvals — full workflow history
router.get(
  '/',
  authorize('approvals', 'read'),
  approvalController.getWorkflowHistory
);

// PATCH /api/approvals/:id/action — approve or reject a step
router.patch(
  '/:id/action',
  authorize('approvals', 'approve'),
  approvalController.takeAction
);

export default router;
