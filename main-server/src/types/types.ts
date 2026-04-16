import { Schema } from "mongoose";

export interface IProcessJob {
  videoUrl: string;
  videoId: Schema.Types.ObjectId;
}
