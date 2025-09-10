import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  videoId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;

  content: string;
  likes: number;
  dislikes: number;
  star: boolean;

  comments: IComment[];
}

export interface ICommentDoc extends IComment, Document {}

const commentSchema = new mongoose.Schema(
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
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    star: { type: Boolean, default: false },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  {
    timestamps: true,
  },
);

export const CommentModel = mongoose.model<ICommentDoc>(
  'Comment',
  commentSchema,
);
