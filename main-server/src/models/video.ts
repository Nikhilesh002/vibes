import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo {
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

  comment: Schema.Types.ObjectId;

  userId: Schema.Types.ObjectId;
}

export interface IVideoDoc extends IVideo, Document {}

const videoSchema = new mongoose.Schema(
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

    comment: { type: Schema.Types.ObjectId, ref: 'Comments' },
  },
  {
    timestamps: true,
  },
);

export const VideoModel = mongoose.model('Video', videoSchema);
