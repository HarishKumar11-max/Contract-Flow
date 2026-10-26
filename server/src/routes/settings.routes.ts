import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Settings read & update endpoints guarded by central authorize()
router.get('/', authorize('settings', 'read'), settingsController.getSettings);
router.patch('/', authorize('settings', 'update'), settingsController.updateSettings);

export default router;
