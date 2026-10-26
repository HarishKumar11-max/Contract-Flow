import { Router } from 'express';
import { listAuditLogs, exportAuditLogs } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Export audit logs as CSV — Admin only (audit-logs:export). Viewer is strictly forbidden from exporting.
router.get('/export', authorize('audit-logs', 'export'), exportAuditLogs);

// Guarded by central authorize('audit-logs', 'read') — Admin and Viewer/Auditor can view audit logs
router.get('/', authorize('audit-logs', 'read'), listAuditLogs);

export default router;
