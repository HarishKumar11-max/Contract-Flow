import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/password';
import { recordAuditLog } from '../utils/audit.util';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'Legal', 'Procurement', 'Finance', 'Approver', 'Viewer']),
  department: z.string().min(2, 'Department is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['Admin', 'Legal', 'Procurement', 'Finance', 'Approver', 'Viewer']).optional(),
  department: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const search = (req.query.search as string) || '';
  const role = req.query.role as string;

  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) {
    query.role = role;
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, department } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({
      error: 'ConflictError',
      message: 'A user with this email address already exists',
    });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    department,
    isActive: true,
  });

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'admin',
    userRole: req.user?.role || 'Admin',
    action: 'CREATE',
    entityType: 'User',
    entityId: user._id.toString(),
    changes: {
      after: { name, email, role, department, isActive: true },
    },
    req,
  });

  res.status(201).json({
    message: 'User created successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({
      error: 'NotFound',
      message: 'User not found',
    });
    return;
  }

  const before = {
    name: user.name,
    role: user.role,
    department: user.department,
    isActive: user.isActive,
  };

  if (updates.name) user.name = updates.name;
  if (updates.role) user.role = updates.role;
  if (updates.department) user.department = updates.department;
  if (updates.isActive !== undefined) user.isActive = updates.isActive;

  await user.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'admin',
    userRole: req.user?.role || 'Admin',
    action: 'UPDATE',
    entityType: 'User',
    entityId: user._id.toString(),
    changes: {
      before,
      after: {
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
      },
    },
    req,
  });

  res.status(200).json({
    message: 'User updated successfully',
    user,
  });
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({
      error: 'NotFound',
      message: 'User not found',
    });
    return;
  }

  // Prevent admin from deactivating themselves
  if (req.user && req.user._id.toString() === user._id.toString()) {
    res.status(400).json({
      error: 'ActionNotAllowed',
      message: 'You cannot deactivate your own account',
    });
    return;
  }

  const previousStatus = user.isActive;
  user.isActive = !user.isActive;
  await user.save();

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'admin',
    userRole: req.user?.role || 'Admin',
    action: 'UPDATE',
    entityType: 'User',
    entityId: user._id.toString(),
    changes: {
      before: { isActive: previousStatus },
      after: { isActive: user.isActive },
    },
    req,
  });

  res.status(200).json({
    message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: user.isActive,
  });
};
