import { Router } from 'express';
import { 
  listUsers, 
  createUser, 
  updateUser, 
  toggleUserStatus, 
  createUserSchema, 
  updateUserSchema 
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// All user management routes require authentication
router.use(authenticate);

router.get('/', authorize('users', 'read'), listUsers);
router.post('/', authorize('users', 'create'), validateRequest(createUserSchema), createUser);
router.put('/:id', authorize('users', 'update'), validateRequest(updateUserSchema), updateUser);
router.patch('/:id/status', authorize('users', 'update'), toggleUserStatus);

export default router;
