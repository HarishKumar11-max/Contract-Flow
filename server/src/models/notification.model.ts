import mongoose, { Document, Schema, Model } from 'mongoose';

export type NotificationType =
  | 'Renewal Reminder'
  | 'Expiry Warning'
  | 'Approval Request'
  | 'Approval Decision'
  | 'Contract Status Change'
  | 'Compliance Alert';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  contractId?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'Renewal Reminder',
        'Expiry Warning',
        'Approval Request',
        'Approval Decision',
        'Contract Status Change',
        'Compliance Alert',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: false,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);
