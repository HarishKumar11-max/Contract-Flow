import { Request, Response } from 'express';
import { Parser as CsvParser } from 'json2csv';
import { AuditLog } from '../models/auditLog.model';
import { recordAuditLog } from '../utils/audit.util';

export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;
  const userEmail = req.query.userEmail as string;
  const search = req.query.search as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const query: any = {};
  if (entityType) query.entityType = entityType;
  if (action) query.action = action;
  if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };

  if (search) {
    query.$or = [
      { userEmail: { $regex: search, $options: 'i' } },
      { userRole: { $regex: search, $options: 'i' } },
      { entityId: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { entityType: { $regex: search, $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.timestamp.$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  res.status(200).json({
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const exportAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;
  const userEmail = req.query.userEmail as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const query: any = {};
  if (entityType) query.entityType = entityType;
  if (action) query.action = action;
  if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.timestamp.$lte = end;
    }
  }

  const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(2000);

  await recordAuditLog({
    userId: req.user?._id.toString(),
    userEmail: req.user?.email || 'system',
    userRole: req.user?.role || 'Admin',
    action: 'EXPORT',
    entityType: 'System',
    entityId: 'audit-logs-export',
    changes: {
      after: {
        count: logs.length,
        filters: { entityType, action, userEmail, startDate, endDate },
      },
    },
    req,
  });

  const fields = [
    { label: 'Timestamp', value: (row: any) => row.timestamp ? new Date(row.timestamp).toISOString() : '' },
    { label: 'User Email', value: 'userEmail' },
    { label: 'User Role', value: 'userRole' },
    { label: 'Action', value: 'action' },
    { label: 'Entity Type', value: 'entityType' },
    { label: 'Entity ID', value: 'entityId' },
    { label: 'IP Address', value: 'ipAddress' },
    { label: 'User Agent', value: 'userAgent' },
    { label: 'Changes', value: (row: any) => JSON.stringify(row.changes || {}) },
  ];

  const parser = new CsvParser({ fields });
  const csv = parser.parse(logs.map((l) => l.toObject()));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-export-${Date.now()}.csv"`);
  res.status(200).send(csv);
};
