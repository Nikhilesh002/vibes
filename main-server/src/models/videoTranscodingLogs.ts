import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoTranscodingLog {
  videoId: Schema.Types.ObjectId;
  logs: string;
}

export interface IVideoTranscodingLogDoc
  extends IVideoTranscodingLog,
    Document {}

const videoTranscodingLogsSchema = new mongoose.Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    logs: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export const VideoTranscodingLogsModel =
  mongoose.model<IVideoTranscodingLogDoc>(
    'VideoTranscodingLogs',
    videoTranscodingLogsSchema,
  );
