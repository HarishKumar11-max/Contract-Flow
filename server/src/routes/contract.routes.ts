import { Router } from 'express';
import {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  transitionState,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  createContractSchema,
  updateContractSchema,
  transitionSchema,
} from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { uploadContractDocument } from '../middleware/upload.middleware';

const router = Router();

// All contract endpoints require authentication
router.use(authenticate);

// Read endpoints: all roles that have contracts:read
router.get('/', authorize('contracts', 'read'), listContracts);
router.get('/:id', authorize('contracts', 'read'), getContractById);

// Document download: all roles with documents:read
router.get('/:id/documents/:docId/download', authorize('documents', 'read'), downloadDocument);

// Creation: Admin and Procurement only (Legal removed per 6-role spec)
router.post(
  '/',
  authorize('contracts', 'create'),
  validateRequest(createContractSchema),
  createContract
);

// Metadata update: Admin and Procurement only; record-level checks in controller
router.put(
  '/:id',
  authorize('contracts', 'update'),
  validateRequest(updateContractSchema),
  updateContract
);

// Deletion: Admin and Procurement only; record-level checks in controller
router.delete('/:id', authorize('contracts', 'delete'), deleteContract);

// State machine transitions: Admin and Procurement (submit own) + legal/finance/approver via approvals route
router.patch(
  '/:id/transition',
  authorize('contracts', 'submit'),
  validateRequest(transitionSchema),
  transitionState
);

// Document upload: Admin and Procurement only; record-level ownership checked in controller
router.post(
  '/:id/documents',
  authorize('documents', 'create'),
  uploadContractDocument.single('file'),
  uploadDocument
);

// Document delete: Admin and Procurement only; record-level checks in controller
router.delete(
  '/:id/documents/:docId',
  authorize('documents', 'delete'),
  deleteDocument
);

export default router;
