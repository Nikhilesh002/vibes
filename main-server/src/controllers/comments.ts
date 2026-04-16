import { Request, Response } from "express";

import { CommentModel } from "../models/comments";
import { UserModel } from "../models/user";

export const getComments = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const videoId = req.params.videoId as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const filter: any = { videoId };
    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const comments = await CommentModel.find(filter)
      .populate({
        path: "userId",
        select: "username avatarUrl",
      })
      .sort({ _id: -1 })
      .limit(limit + 1);

    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();

    return res.status(200).json({
      success: true,
      comments,
      nextCursor: hasMore ? comments[comments.length - 1]._id : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching comments",
    });
  }
};

export const postComment = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { content, parentCommentId } = req.body;
    const userId = req.userId;
    const videoId = req.params.videoId as string;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await CommentModel.create({
      videoId,
      userId,
      content,
      parentCommentId: parentCommentId ?? null,
      username: user.username,
    } as any);

    return res.status(201).json({
      success: true,
      message: "Comment posted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error posting comment",
    });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.userId;

    const comment = await CommentModel.findOneAndDelete({
      _id: commentId,
      userId,
    } as any);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting comment",
    });
  }
};
