import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoJob {
  tempUrl: string;
  blobName: string;
  status: 'IN_QUEUE' | 'DONE' | 'PENDING' | 'FAILED';
  logs: string;
  tags: string[];
  description: string;
  transcodedVideoUrl: string;
  thumbnailUrl: string;
  title: string;
  completedAt: number;

  views: number;
  likes: number;
  dislikes: number;

  comments: Schema.Types.ObjectId[];

  userId: Schema.Types.ObjectId;
}

export interface IVideoJobDoc extends IVideoJob, Document {}

const videoJobSchema = new mongoose.Schema(
  {
    tempUrl: { type: String, required: true, index: true },
    blobName: { type: String, required: true, index: true },
    status: { type: String, required: true, default: 'PENDING' },
    logs: { type: String, default: '' },
    tags: [{ type: String, default: [] }],
    description: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    completedAt: { type: Date },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transcodedVideoUrl: { type: String, default: '' },

    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },

    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  {
    timestamps: true,
  },
);

export const VideoJobModel = mongoose.model('VideoJob', videoJobSchema);
