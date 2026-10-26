import mongoose, { Document, Schema, Model } from 'mongoose';

export type VendorCategory = 
  | 'Software/SaaS' 
  | 'Hardware' 
  | 'Professional Services' 
  | 'Consulting' 
  | 'Logistics' 
  | 'Other';

export type VendorStatus = 'Active' | 'Under Review' | 'Suspended' | 'Terminated';
export type RiskScore = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IVendor extends Document {
  name: string;
  code: string;
  category: VendorCategory;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  taxId: string;
  status: VendorStatus;
  performanceRating: number;
  riskScore: RiskScore;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Vendor unique code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Software/SaaS', 'Hardware', 'Professional Services', 'Consulting', 'Logistics', 'Other'],
      default: 'Software/SaaS',
      required: true,
      index: true,
    },
    contactPerson: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: '' },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'USA' },
      postalCode: { type: String, default: '' },
    },
    taxId: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Under Review', 'Suspended', 'Terminated'],
      default: 'Active',
      required: true,
      index: true,
    },
    performanceRating: {
      type: Number,
      min: 1.0,
      max: 5.0,
      default: 3.5,
      required: true,
    },
    riskScore: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Vendor: Model<IVendor> = 
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', vendorSchema);
