import mongoose, { Document, Schema } from 'mongoose';

export interface ILog {
  videoId: Schema.Types.ObjectId;
  logs: string;
  logsBlobUrl: string;
}

export interface ILogDoc extends ILog, Document {}

const logsSchema = new mongoose.Schema(
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
    logsBlobUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export const LogsModel = mongoose.model<ILogDoc>('Log', logsSchema);
