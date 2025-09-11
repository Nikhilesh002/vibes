import mongoose, { Document, Schema } from 'mongoose';

export interface ILike {
  videoId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;

  likeStatus: 'LIKED' | 'DISLIKED' | 'NONE';
}

export interface ILikeDoc extends ILike, Document {}

const likeSchema = new mongoose.Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'VideoJob',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    likeStatus: {
      type: String,
      enum: ['LIKED', 'DISLIKED', 'NONE'],
      default: 'NONE',
    },
  },
  {
    timestamps: true,
  },
);

likeSchema.index({ videoId: 1, userId: 1 }, { unique: true });

export const LikeModel = mongoose.model<ILikeDoc>('Like', likeSchema);
