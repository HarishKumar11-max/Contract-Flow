import { Request, Response } from 'express';
import { z } from 'zod';
import { Vendor } from '../models/vendor.model';
import { recordAuditLog } from '../utils/audit.util';

export const createVendorSchema = z.object({
  name: z.string().min(2, 'Vendor name must be at least 2 characters').trim(),
  code: z.string().min(2, 'Code must be at least 2 characters').trim().toUpperCase(),
  category: z.enum([
    'Software/SaaS',
    'Hardware',
    'Professional Services',
    'Consulting',
    'Logistics',
    'Other',
  ]),
  contactPerson: z.object({
    name: z.string().min(1, 'Contact person name is required'),
    email: z.string().email('Valid contact email is required').toLowerCase().trim(),
    phone: z.string().optional().default(''),
  }),
  address: z
    .object({
      street: z.string().optional().default(''),
      city: z.string().optional().default(''),
      state: z.string().optional().default(''),
      country: z.string().optional().default('USA'),
      postalCode: z.string().optional().default(''),
    })
    .optional()
    .default({}),
  taxId: z.string().optional().default(''),
  status: z.enum(['Active', 'Under Review', 'Suspended', 'Terminated']).optional().default('Active'),
  performanceRating: z.number().min(1.0).max(5.0).optional().default(3.5),
  riskScore: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Low'),
  notes: z.string().optional().default(''),
});

export const updateVendorSchema = z.object({
  name: z.string().min(2).optional(),
  category: z
    .enum(['Software/SaaS', 'Hardware', 'Professional Services', 'Consulting', 'Logistics', 'Other'])
    .optional(),
  contactPerson: z
    .object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  taxId: z.string().optional(),
  status: z.enum(['Active', 'Under Review', 'Suspended', 'Terminated']).optional(),
  performanceRating: z.number().min(1.0).max(5.0).optional(),
  riskScore: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  notes: z.string().optional(),
});

export const updateRatingSchema = z.object({
  rating: z.number().min(1.0).max(5.0),
});

export const listVendors = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const search = (req.query.search as string) || '';
  const category = req.query.category as string;
  const riskScore = req.query.riskScore as string;
  const status = req.query.status as string;

  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { 'contactPerson.name': { $regex: search, $options: 'i' } },
      { 'contactPerson.email': { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (riskScore) query.riskScore = riskScore;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [vendors, total, activeCount, highRiskCount, stats] = await Promise.all([
    Vendor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vendor.countDocuments(query),
    Vendor.countDocuments({ status: 'Active' }),
    Vendor.countDocuments({ riskScore: { $in: ['High', 'Critical'] } }),
    Vendor.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$performanceRating' },
        },
      },
    ]),
  ]);

  const avgPerformanceRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

  res.status(200).json({
    vendors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    metrics: {
      totalVendors: await Vendor.countDocuments(),
      activeVendors: activeCount,
      highRiskVendors: highRiskCount,
      avgPerformanceRating,
    },
  });
};

export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Vendor not found',
    });
    return;
  }

  res.status(200).json({ vendor });
};

export const createVendor = async (req: Request, res: Response): Promise<void> => {
  const data = req.body;

  // Check code uniqueness
  const existingVendor = await Vendor.findOne({ code: data.code.toUpperCase() });
  if (existingVendor) {
    res.status(409).json({
      error: 'ConflictError',
      message: `A vendor with code '${data.code.toUpperCase()}' already exists`,
    });
    return;
  }

  const vendor = await Vendor.create({
    ...data,
    code: data.code.toUpperCase(),
    createdBy: req.user?._id,
  });

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Procurement',
    action: 'CREATE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    changes: {
      after: {
        name: vendor.name,
        code: vendor.code,
        category: vendor.category,
        riskScore: vendor.riskScore,
        performanceRating: vendor.performanceRating,
      },
    },
    req,
  });

  res.status(201).json({
    message: 'Vendor created successfully',
    vendor,
  });
};

export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Vendor not found',
    });
    return;
  }

  // Only Admin can blacklist (Suspended) or terminate vendors
  if ((updates.status === 'Suspended' || updates.status === 'Terminated') && req.user?.role !== 'Admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Only Administrators can blacklist or terminate vendors.',
    });
    return;
  }

  const before = {
    name: vendor.name,
    category: vendor.category,
    status: vendor.status,
    riskScore: vendor.riskScore,
    performanceRating: vendor.performanceRating,
    contactPerson: vendor.contactPerson,
  };

  Object.assign(vendor, updates);
  await vendor.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Procurement',
    action: 'UPDATE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    changes: {
      before,
      after: updates,
    },
    req,
  });

  res.status(200).json({
    message: 'Vendor updated successfully',
    vendor,
  });
};

export const updatePerformanceRating = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rating } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Vendor not found',
    });
    return;
  }

  const previousRating = vendor.performanceRating;
  vendor.performanceRating = rating;
  await vendor.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Procurement',
    action: 'UPDATE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    changes: {
      before: { performanceRating: previousRating },
      after: { performanceRating: rating },
    },
    req,
  });

  res.status(200).json({
    message: 'Performance rating updated successfully',
    vendor,
  });
};

export const deleteVendor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Vendor not found',
    });
    return;
  }

  await Vendor.findByIdAndDelete(id);

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'admin',
    userRole: req.user?.role || 'Admin',
    action: 'DELETE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    changes: {
      before: { name: vendor.name, code: vendor.code },
    },
    req,
  });

  res.status(200).json({
    message: 'Vendor deleted successfully',
  });
};
