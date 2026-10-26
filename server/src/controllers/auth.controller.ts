import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { recordAuditLog } from '../utils/audit.util';
import { ROLE_PERMISSIONS } from '../config/permissions';
import { env } from '../config/env';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid email or password',
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      error: 'AccountDeactivated',
      message: 'This account has been deactivated. Please contact an administrator.',
    });
    return;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      error: 'AuthenticationError',
      message: 'Invalid email or password',
    });
    return;
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    department: user.department,
  });

  await recordAuditLog({
    userId: user._id.toString(),
    userEmail: user.email,
    userRole: user.role,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user._id.toString(),
    req,
  });

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
    },
    permissions: ROLE_PERMISSIONS[user.role],
    demoMode: env.DEMO_MODE,
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    permissions: ROLE_PERMISSIONS[user.role],
    demoMode: env.DEMO_MODE,
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await recordAuditLog({
      userId: req.user._id.toString(),
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user._id.toString(),
      req,
    });
  }

  res.status(200).json({
    message: 'Logged out successfully',
  });
};
