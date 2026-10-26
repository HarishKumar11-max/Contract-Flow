import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISystemSettings extends Document {
  tier1Threshold: number;
  tier2Threshold: number;
  reminderNoticeDays: number[];
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    tier1Threshold: {
      type: Number,
      required: true,
      default: 25000,
    },
    tier2Threshold: {
      type: Number,
      required: true,
      default: 100000,
    },
    reminderNoticeDays: {
      type: [Number],
      default: [30, 60, 90],
    },
    smtpHost: {
      type: String,
      default: 'smtp.mailtrap.io',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: 'clm-system-mailer',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
