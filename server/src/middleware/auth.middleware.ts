import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { User, IUser } from '../models/user.model';

// Extend Express Request interface to hold authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is missing or malformed',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User associated with this token does not exist',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Your account has been deactivated. Contact an administrator.',
      });
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid authentication token',
    });
  }
};
