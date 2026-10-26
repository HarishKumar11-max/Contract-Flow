import { Router } from 'express';
import {
  getAnalytics,
  exportContracts,
  exportVendors,
  exportApprovals,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Executive spend analytics and portfolio metrics
router.get('/analytics', authorize('reports', 'read'), getAnalytics);

// Exports
router.get('/contracts/export', authorize('reports', 'export'), exportContracts);
router.get('/vendors/export', authorize('reports', 'export'), exportVendors);
router.get('/approvals/export', authorize('reports', 'export'), exportApprovals);

export default router;
