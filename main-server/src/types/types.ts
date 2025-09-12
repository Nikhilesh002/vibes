import { Schema } from "mongoose";

export interface IBucket {
  [ip_route: string]: {
    tokens: number;
  };
}

export interface IProcessJob {
  videoUrl: string;
  videoId: Schema.Types.ObjectId;
}
