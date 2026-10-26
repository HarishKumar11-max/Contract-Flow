import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
import { ModuleName, ActionName, hasPermission } from '../config/permissions';
import { recordAuditLog } from '../utils/audit.util';

/**
 * Deny-by-default role & module authorization middleware.
 * If user lacks permission for action on module, logs ACCESS_DENIED to audit log and returns 403.
 */
export const authorize = (module: ModuleName, action: ActionName) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to permission check',
      });
      return;
    }

    const permitted = hasPermission(req.user.role, module, action);

    if (!permitted) {
      // Record denied request in immutable audit log
      try {
        await recordAuditLog({
          userId: req.user._id.toString(),
          userEmail: req.user.email,
          userRole: req.user.role,
          action: 'ACCESS_DENIED',
          entityType: 'System',
          entityId: req.originalUrl,
          changes: {
            after: {
              module,
              action,
              path: req.originalUrl,
              method: req.method,
              reason: `Role '${req.user.role}' lacks '${action}' permission on module '${module}'.`,
            },
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        });
      } catch (err) {
        console.error('[RBAC] Error recording denied audit log:', err);
      }

      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized to perform '${action}' on '${module}'.`,
      });
      return;
    }

    next();
  };
};

/**
 * Role-based guard (backward compatible helper)
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to permission check',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      recordAuditLog({
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'ACCESS_DENIED',
        entityType: 'System',
        entityId: req.originalUrl,
        changes: {
          after: {
            path: req.originalUrl,
            method: req.method,
            requiredRoles: allowedRoles,
            actualRole: req.user.role,
          },
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      }).catch((err) => console.error('[RBAC] Error recording denied audit log:', err));

      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized for this action. Required: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
