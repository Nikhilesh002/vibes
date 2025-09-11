import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription {
  creatorId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  isNotificationsEnabled: boolean;
}

export interface ISubscriptionDoc extends ISubscription, Document {}

const subscriptionSchema = new mongoose.Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
subscriptionSchema.index({ creatorId: 1, userId: 1 }, { unique: true });

export const SubscriptionModel = mongoose.model<ISubscriptionDoc>(
  'Subscription',
  subscriptionSchema,
);
