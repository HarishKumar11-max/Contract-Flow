import { Router } from 'express';
import {
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  updatePerformanceRating,
  createVendorSchema,
  updateVendorSchema,
  updateRatingSchema,
} from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// All vendor routes require authentication
router.use(authenticate);

// Read endpoints
router.get('/', authorize('vendors', 'read'), listVendors);
router.get('/:id', authorize('vendors', 'read'), getVendorById);

// Create and edit endpoints
router.post('/', authorize('vendors', 'create'), validateRequest(createVendorSchema), createVendor);
router.put('/:id', authorize('vendors', 'update'), validateRequest(updateVendorSchema), updateVendor);
router.patch(
  '/:id/rating',
  authorize('vendors', 'update'),
  validateRequest(updateRatingSchema),
  updatePerformanceRating
);

// Delete endpoint: restricted to Admin only via permissions matrix
router.delete('/:id', authorize('vendors', 'delete'), deleteVendor);

export default router;
