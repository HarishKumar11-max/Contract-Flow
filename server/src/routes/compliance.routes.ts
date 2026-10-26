import { Router } from 'express';
import { complianceController } from '../controllers/compliance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Radar analytics — all roles with compliance:read
router.get('/radar', authorize('compliance', 'read'), complianceController.getRadarMetrics);

// Trigger on-demand radar sweep — Admin only (reminder-jobs:run-job)
router.post(
  '/sweep',
  authorize('reminder-jobs', 'run-job'),
  complianceController.triggerSweep
);

// Verify/update compliance item status — Admin and Legal only (compliance:update)
router.patch(
  '/contracts/:id/items/:itemId',
  authorize('compliance', 'update'),
  complianceController.updateComplianceItem
);

// Add new compliance item to contract — Admin and Legal only (compliance:create)
router.post(
  '/contracts/:id/items',
  authorize('compliance', 'create'),
  complianceController.addComplianceItem
);

export default router;
