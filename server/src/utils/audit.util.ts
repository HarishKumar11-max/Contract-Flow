import { Request } from 'express';
import { AuditLog, AuditAction, AuditEntityType } from '../models/auditLog.model';

export interface AuditLogParams {
  userId?: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  req?: Request;
  ipAddress?: string;
  userAgent?: string;
}

export const recordAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    const ipAddress =
      params.ipAddress ||
      params.req?.headers['x-forwarded-for']?.toString() ||
      params.req?.socket?.remoteAddress ||
      '';
    const userAgent = params.userAgent || params.req?.headers['user-agent'] || '';

    await AuditLog.create({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes || {},
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error);
  }
};
