import mongoose, { Document, Schema, Model } from 'mongoose';

export type ContractType = 
  | 'MSA' 
  | 'NDA' 
  | 'SOW' 
  | 'SLA' 
  | 'Vendor Agreement' 
  | 'Employment' 
  | 'License' 
  | 'Other';

export type ContractStatus = 
  | 'Draft' 
  | 'In Review' 
  | 'Pending Approval' 
  | 'Approved' 
  | 'Active' 
  | 'Expiring Soon' 
  | 'Expired' 
  | 'Terminated' 
  | 'Rejected' 
  | 'Amended';

export type RenewalType = 'Auto-Renew' | 'Manual Review' | 'Do Not Renew';

export interface IContractDocument {
  docId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadedBy?: mongoose.Types.ObjectId;
  uploadedAt: Date;
  notes?: string;
}

export interface IComplianceItem {
  id: string;
  title: string;
  description?: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending Review';
  dueDate?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
}

export interface IContract extends Document {
  contractNumber: string;
  title: string;
  description: string;
  type: ContractType;
  vendorId: mongoose.Types.ObjectId;
  status: ContractStatus;
  value: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  renewalType: RenewalType;
  renewalNoticeDays: number;
  autoRenewTermMonths?: number;
  ownerId: mongoose.Types.ObjectId;
  department: string;
  documents: IContractDocument[];
  currentVersion: number;
  complianceItems: IComplianceItem[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const contractDocumentSchema = new Schema<IContractDocument>(
  {
    docId: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const complianceItemSchema = new Schema<IComplianceItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Compliant', 'Non-Compliant', 'Pending Review'],
      default: 'Pending Review',
    },
    dueDate: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const contractSchema = new Schema<IContract>(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Contract title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['MSA', 'NDA', 'SOW', 'SLA', 'Vendor Agreement', 'Employment', 'License', 'Other'],
      default: 'Vendor Agreement',
      required: true,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'In Review',
        'Pending Approval',
        'Approved',
        'Active',
        'Expiring Soon',
        'Expired',
        'Terminated',
        'Rejected',
        'Amended',
      ],
      default: 'Draft',
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: [true, 'Contract monetary value is required'],
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    renewalType: {
      type: String,
      enum: ['Auto-Renew', 'Manual Review', 'Do Not Renew'],
      default: 'Manual Review',
      required: true,
    },
    renewalNoticeDays: {
      type: Number,
      default: 30,
    },
    autoRenewTermMonths: {
      type: Number,
      default: 12,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    documents: [contractDocumentSchema],
    currentVersion: {
      type: Number,
      default: 1,
    },
    complianceItems: [complianceItemSchema],
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate contract number helper
export const generateContractNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `CTR-${currentYear}-`;

  const lastContract = await Contract.findOne({
    contractNumber: { $regex: `^${prefix}` },
  }).sort({ contractNumber: -1 });

  let sequence = 1;
  if (lastContract) {
    const parts = lastContract.contractNumber.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

export const Contract: Model<IContract> = 
  mongoose.models.Contract || mongoose.model<IContract>('Contract', contractSchema);
