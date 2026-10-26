import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  department: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};
