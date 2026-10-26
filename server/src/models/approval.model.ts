import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserRole } from './user.model';

export type ApprovalStepRole = 'Legal' | 'Finance' | 'Procurement' | 'Admin' | 'Approver';
export type ApprovalStepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
export type WorkflowStatus = 'In Progress' | 'Approved' | 'Rejected';

export interface IApprovalStep {
  stepNumber: number;
  roleRequired: ApprovalStepRole;
  assignedTo?: mongoose.Types.ObjectId;
  status: ApprovalStepStatus;
  comments?: string;
  actionDate?: Date;
  actedBy?: mongoose.Types.ObjectId;
}

export interface IApprovalWorkflow extends Document {
  contractId: mongoose.Types.ObjectId;
  currentStepIndex: number;
  status: WorkflowStatus;
  steps: IApprovalStep[];
  initiatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const approvalStepSchema = new Schema<IApprovalStep>(
  {
    stepNumber: { type: Number, required: true },
    roleRequired: {
      type: String,
      enum: ['Legal', 'Finance', 'Procurement', 'Admin', 'Approver'],
      required: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Skipped'],
      default: 'Pending',
      required: true,
    },
    comments: { type: String, default: '' },
    actionDate: { type: Date },
    actedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const approvalWorkflowSchema = new Schema<IApprovalWorkflow>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    currentStepIndex: {
      type: Number,
      default: 0,
      required: true,
    },
    status: {
      type: String,
      enum: ['In Progress', 'Approved', 'Rejected'],
      default: 'In Progress',
      required: true,
      index: true,
    },
    steps: [approvalStepSchema],
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ApprovalWorkflow: Model<IApprovalWorkflow> =
  mongoose.models.ApprovalWorkflow ||
  mongoose.model<IApprovalWorkflow>('ApprovalWorkflow', approvalWorkflowSchema);
