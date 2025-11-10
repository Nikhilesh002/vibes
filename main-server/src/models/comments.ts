import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  videoId: Schema.Types.ObjectId;
  parentCommentId: Schema.Types.ObjectId | null;

  userId: Schema.Types.ObjectId;
  username: string;

  content: string;
  likes: number;
  dislikes: number;
  star: boolean;
}

export interface ICommentDoc extends IComment, Document {}

const commentSchema = new mongoose.Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: { type: String, required: true },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    star: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const CommentModel = mongoose.model<ICommentDoc>(
  'Comments',
  commentSchema,
);
