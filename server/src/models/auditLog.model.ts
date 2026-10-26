import mongoose, { Document, Schema, Model } from 'mongoose';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'STATUS_TRANSITION' 
  | 'DOCUMENT_UPLOAD' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EXPORT'
  | 'ACCESS_DENIED';

export type AuditEntityType = 'Contract' | 'Vendor' | 'Approval' | 'User' | 'System';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'STATUS_TRANSITION',
        'DOCUMENT_UPLOAD',
        'APPROVE',
        'REJECT',
        'LOGIN',
        'LOGOUT',
        'EXPORT',
        'ACCESS_DENIED',
      ],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['Contract', 'Vendor', 'Approval', 'User', 'System'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog: Model<IAuditLog> = 
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
