import { Request, Response } from 'express';
import { CommentModel } from '../models/comments';
import { UserModel } from '../models/user';

export const getComments = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { videoId } = req.params;

    const comments = await CommentModel.find({ videoId })
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching comments',
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
    const { videoId } = req.params;

    if (!content || content.trim() === '' || !videoId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await CommentModel.create({
      videoId,
      userId,
      content,
      parentCommentId: parentCommentId || null,
      username: user.username,
    });

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error posting comment',
    });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const comment = await CommentModel.findOneAndDelete({
      _id: commentId,
      userId,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting comment',
    });
  }
};
