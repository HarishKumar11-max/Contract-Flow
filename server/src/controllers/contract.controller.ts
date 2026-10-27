import { Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { Contract, IContract, generateContractNumber, ContractStatus } from '../models/contract.model';
import { stateMachineService } from '../services/stateMachine.service';
import { recordAuditLog } from '../utils/audit.util';

export const createContractSchema = z.object({
  title: z.string().min(2, 'Contract title must be at least 2 characters').trim(),
  description: z.string().optional().default(''),
  type: z.enum(['MSA', 'NDA', 'SOW', 'SLA', 'Vendor Agreement', 'Employment', 'License', 'Other']),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  value: z.number().min(0, 'Value must be greater than or equal to 0'),
  currency: z.string().optional().default('INR'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  renewalType: z.enum(['Auto-Renew', 'Manual Review', 'Do Not Renew']).optional().default('Manual Review'),
  renewalNoticeDays: z.number().optional().default(30),
  autoRenewTermMonths: z.number().optional().default(12),
  department: z.string().optional().default('Operations'),
  tags: z.array(z.string()).optional().default([]),
});

export const updateContractSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  type: z.enum(['MSA', 'NDA', 'SOW', 'SLA', 'Vendor Agreement', 'Employment', 'License', 'Other']).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalType: z.enum(['Auto-Renew', 'Manual Review', 'Do Not Renew']).optional(),
  renewalNoticeDays: z.number().optional(),
  autoRenewTermMonths: z.number().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const transitionSchema = z.object({
  targetStatus: z.enum([
    'Draft',
    'In Review',
    'Pending Approval',
    'Approved',
    'Active',
    'Expiring Soon',
    'Expired',
    'Terminated',
    'Rejected',
    'Amended',
  ]),
  notes: z.string().optional(),
});

/** Helper: checks if a Procurement user owns the contract. Returns 403 if not. */
const assertProcurementOwnership = (req: Request, res: Response, contract: IContract): boolean => {
  if (req.user?.role === 'Procurement') {
    const ownerId = contract.ownerId?.toString();
    const userId = req.user._id?.toString();
    if (ownerId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Procurement users can only modify their own contracts.',
      });
      return false;
    }
  }
  return true;
};

export const listContracts = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const search = (req.query.search as string) || '';
  const status = req.query.status as string;
  const vendorId = req.query.vendorId as string;
  const type = req.query.type as string;
  const department = req.query.department as string;

  const query: any = {};

  // Procurement: only see their own contracts in list
  if (req.user?.role === 'Procurement') {
    query.ownerId = req.user._id;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { contractNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (status) query.status = status;
  if (vendorId) query.vendorId = vendorId;
  if (type) query.type = type;
  if (department) query.department = department;

  const skip = (page - 1) * limit;

  const [contracts, total, totalValueAgg, statusCounts] = await Promise.all([
    Contract.find(query)
      .populate('vendorId', 'name code category')
      .populate('ownerId', 'name email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Contract.countDocuments(query),
    Contract.aggregate([
      { $group: { _id: null, totalVal: { $sum: '$value' } } },
    ]),
    Contract.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const metricsMap: Record<string, number> = {};
  statusCounts.forEach((s) => {
    metricsMap[s._id] = s.count;
  });

  const totalContractValue = totalValueAgg.length > 0 ? totalValueAgg[0].totalVal : 0;

  res.status(200).json({
    contracts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    metrics: {
      totalContracts: await Contract.countDocuments(),
      activeContracts: metricsMap['Active'] || 0,
      inReviewContracts: (metricsMap['In Review'] || 0) + (metricsMap['Pending Approval'] || 0),
      expiringSoonContracts: metricsMap['Expiring Soon'] || 0,
      totalContractValue,
    },
  });
};

export const getContractById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const contract = await Contract.findById(id)
    .populate('vendorId', 'name code category riskScore performanceRating contactPerson')
    .populate('ownerId', 'name email role department');

  if (!contract) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Contract not found',
    });
    return;
  }

  const allowedTransitions = stateMachineService.getAllowedTransitions(contract.status);

  res.status(200).json({
    contract,
    allowedTransitions,
  });
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const contractNumber = await generateContractNumber();

  const contract = await Contract.create({
    ...data,
    contractNumber,
    status: 'Draft',
    ownerId: req.user?._id,
    department: data.department || req.user?.department || 'Operations',
    currentVersion: 1,
    documents: [],
    complianceItems: [
      {
        id: `comp-${Date.now()}-1`,
        title: 'Master Service Agreement Execution',
        description: 'Verify all legal clauses and signature pages are countersigned.',
        status: 'Pending Review',
      },
      {
        id: `comp-${Date.now()}-2`,
        title: 'Certificate of Commercial Insurance',
        description: 'Supplier must provide active general liability insurance proof.',
        status: 'Pending Review',
      },
      {
        id: `comp-${Date.now()}-3`,
        title: 'Mutual Non-Disclosure Agreement (NDA)',
        description: 'Signed reciprocal confidentiality protections on file.',
        status: 'Compliant',
      },
    ],
  });

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Procurement',
    action: 'CREATE',
    entityType: 'Contract',
    entityId: contract._id.toString(),
    changes: {
      after: {
        contractNumber: contract.contractNumber,
        title: contract.title,
        status: contract.status,
        value: contract.value,
        vendorId: contract.vendorId,
      },
    },
    req,
  });

  res.status(201).json({
    message: 'Contract draft created successfully',
    contract,
  });
};

export const updateContract = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Contract not found',
    });
    return;
  }

  // Record-level ownership check for Procurement
  if (!assertProcurementOwnership(req, res, contract)) return;

  // Business rule: Procurement can only edit contracts in Draft or Rejected status
  if (req.user?.role === 'Procurement' && !['Draft', 'Rejected'].includes(contract.status)) {
    res.status(400).json({
      error: 'InvalidOperation',
      message: `Procurement users can only edit contracts in Draft or Rejected status. Current status: '${contract.status}'.`,
    });
    return;
  }

  // Admin can edit contracts in Draft or In Review
  if (req.user?.role === 'Admin' && !['Draft', 'In Review'].includes(contract.status)) {
    res.status(400).json({
      error: 'InvalidOperation',
      message: `Contract cannot be modified while in '${contract.status}' status. Only Draft or In Review contracts can be edited.`,
    });
    return;
  }

  const before = {
    title: contract.title,
    value: contract.value,
    startDate: contract.startDate,
    endDate: contract.endDate,
  };

  Object.assign(contract, updates);
  await contract.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Procurement',
    action: 'UPDATE',
    entityType: 'Contract',
    entityId: contract._id.toString(),
    changes: {
      before,
      after: updates,
    },
    req,
  });

  res.status(200).json({
    message: 'Contract updated successfully',
    contract,
  });
};

export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Contract not found',
    });
    return;
  }

  // Record-level ownership check for Procurement
  if (!assertProcurementOwnership(req, res, contract)) return;

  // Security & Safety Rule: Deletion only allowed in Draft status
  if (contract.status !== 'Draft') {
    res.status(400).json({
      error: 'IllegalOperation',
      message: `Deletion prohibited. Contracts in '${contract.status}' status cannot be deleted to maintain legal audit integrity. Only Draft contracts may be deleted.`,
    });
    return;
  }

  await Contract.findByIdAndDelete(id);

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'admin',
    userRole: req.user?.role || 'Admin',
    action: 'DELETE',
    entityType: 'Contract',
    entityId: contract._id.toString(),
    changes: {
      before: {
        contractNumber: contract.contractNumber,
        title: contract.title,
        status: contract.status,
      },
    },
    req,
  });

  res.status(200).json({
    message: `Contract draft ${contract.contractNumber} deleted successfully`,
  });
};

export const transitionState = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { targetStatus, notes } = req.body;

  const contract = await Contract.findById(id);
  if (!contract) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Contract not found',
    });
    return;
  }

  // Record-level ownership check for Procurement (submit = initiate approval workflow)
  if (!assertProcurementOwnership(req, res, contract)) return;

  const previousStatus = contract.status;

  try {
    const updated = await stateMachineService.validateAndExecute(contract, targetStatus as ContractStatus);

    await recordAuditLog({
      userId: req.user?._id.toString(),
      userEmail: req.user?.email || 'system',
      userRole: req.user?.role || 'Legal',
      action: 'STATUS_TRANSITION',
      entityType: 'Contract',
      entityId: contract._id.toString(),
      changes: {
        before: { status: previousStatus },
        after: { status: updated.status, notes: notes || '' },
      },
      req,
    });

    const allowedTransitions = stateMachineService.getAllowedTransitions(updated.status);

    res.status(200).json({
      message: `Contract transitioned successfully from '${previousStatus}' to '${updated.status}'`,
      contract: updated,
      allowedTransitions,
    });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({
      error: err.name || 'TransitionError',
      message: err.message,
    });
  }
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'No document file uploaded. Supported formats: PDF, DOCX, DOC, TXT.',
    });
    return;
  }

  const contract = await Contract.findById(id);
  if (!contract) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Contract not found',
    });
    return;
  }

  // Record-level ownership check for Procurement
  if (!assertProcurementOwnership(req, res, contract)) return;

  const nextVersion = contract.documents.length + 1;
  const docId = `doc-${Date.now()}-v${nextVersion}`;

  const docItem = {
    docId,
    fileName: file.filename,
    originalName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    version: nextVersion,
    uploadedBy: req.user?._id,
    uploadedAt: new Date(),
    notes: req.body.notes || `Version ${nextVersion} uploaded by ${req.user?.name}`,
  };

  contract.documents.push(docItem);
  contract.currentVersion = nextVersion;
  await contract.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Legal',
    action: 'DOCUMENT_UPLOAD',
    entityType: 'Contract',
    entityId: contract._id.toString(),
    changes: {
      after: {
        docId,
        fileName: file.originalname,
        version: nextVersion,
        size: file.size,
      },
    },
    req,
  });

  res.status(200).json({
    message: `Document '${file.originalname}' (Version ${nextVersion}) uploaded successfully`,
    document: docItem,
    currentVersion: contract.currentVersion,
  });
};

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  const { id, docId } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    res.status(404).json({ error: 'NotFound', message: 'Contract not found' });
    return;
  }

  const doc = contract.documents.find((d) => d.docId === docId);
  if (!doc) {
    res.status(404).json({ error: 'NotFound', message: 'Document version not found' });
    return;
  }

  if (!fs.existsSync(doc.filePath)) {
    res.status(404).json({
      error: 'FileNotFound',
      message: 'The requested document file could not be found on server disk',
    });
    return;
  }

  res.download(doc.filePath, doc.originalName);
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  const { id, docId } = req.params;

  const contract = await Contract.findById(id);
  if (!contract) {
    res.status(404).json({ error: 'NotFound', message: 'Contract not found' });
    return;
  }

  // Record-level ownership check for Procurement
  if (!assertProcurementOwnership(req, res, contract)) return;

  const docIndex = contract.documents.findIndex((d) => d.docId === docId);
  if (docIndex === -1) {
    res.status(404).json({ error: 'NotFound', message: 'Document not found on this contract' });
    return;
  }

  const doc = contract.documents[docIndex];

  // Attempt to remove file from disk
  if (fs.existsSync(doc.filePath)) {
    try {
      fs.unlinkSync(doc.filePath);
    } catch (err) {
      console.warn('[Contract] Could not delete file from disk:', err);
    }
  }

  contract.documents.splice(docIndex, 1);
  await contract.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Procurement',
    action: 'DELETE',
    entityType: 'Contract',
    entityId: contract._id.toString(),
    changes: {
      before: {
        docId,
        fileName: doc.originalName,
      },
    },
    req,
  });

  res.status(200).json({
    message: `Document '${doc.originalName}' removed from contract`,
  });
};
