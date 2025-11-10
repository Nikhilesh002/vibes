import { Request, Response } from 'express';
import {
  getPresignedUrl,
  makePresignedUrl,
} from '../utils/azureBlob/makePresignedUrl';
import { VideoModel } from '../models/video';
import { LikeModel } from '../models/like';
import { db } from '../configs/db';

export async function preSignedUrl(req: Request, res: Response): Promise<any> {
  try {
    // u get metadata of video
    const metadata = req.body;
    const { videoKey, thumbnailKey, title, description, tags } = metadata;

    // use tempbucket
    const { url: videoUrl, sasKey: videoSasKey } = makePresignedUrl(
      'tempbucket',
      videoKey,
      'c',
    );
    const { url: thumbnailUrl, sasKey: thumbnailSasKey } = makePresignedUrl(
      'thumbnail',
      thumbnailKey,
      'c',
    );

    console.log({ videoUrl, videoSasKey, thumbnailUrl, thumbnailSasKey });

    // store url in db
    const resp = await VideoModel.create({
      blobName: videoKey,
      title,
      description,
      tags,
      tempUrl: videoUrl,
      thumbnailUrl,
      status: 'PENDING',
      logs: '',
      transcodedVideoUrl: '',
      completedAt: 0,
      userId: req.userId,
    });

    return res.status(200).json({
      success: true,
      videoUrl,
      videoSasKey,
      thumbnailUrl,
      thumbnailSasKey,
      videoId: resp._id,
    });
  } catch (error) {
    console.error('Error creating signed URL', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
}

export const allVideos = async (req: Request, res: Response): Promise<any> => {
  try {
    const videos = await VideoModel.find({})
      .limit(30)
      .select('-logs -__v -transcodedVideoUrl -tempUrl');

    console.log({ videos });

    videos.forEach((video: any) => {
      if (!video) return;
      if (video.thumbnailUrl.includes('.blob.core.windows.net/'))
        video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, 'r');
    });

    return res.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error('Error getting videos', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

export const getVideoById = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    const video = await VideoModel.findByIdAndUpdate(videoId, {
      $inc: { views: 1 },
    });
    if (!video) {
      console.error('Video not found!!');
      return res.status(400).json({
        success: false,
        msg: 'Video not found',
      });
    }

    const like = await LikeModel.findOne({
      videoId,
      userId,
    });

    if (video.thumbnailUrl.includes('.blob.core.windows.net/'))
      video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, 'r');

    // TODO: no auth
    // if (video.transcodedVideoUrl.includes('.blob.core.windows.net/'))
    //   video.transcodedVideoUrl = getPresignedUrl(video.transcodedVideoUrl, 'r');

    return res.json({
      success: true,
      video,
      likeStatus: like ? like.likeStatus : 'NONE',
    });
  } catch (error) {
    console.error('Error getting video by id', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

export const likeVideo = async (req: Request, res: Response): Promise<any> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    const session = await db.startSession();

    try {
      session.startTransaction();

      const resp1 = await LikeModel.findOne({ videoId, userId }).session(
        session,
      );

      if (resp1) {
        if (resp1.likeStatus === 'LIKED') {
          // already liked, remove like
          const resp2 = await LikeModel.deleteOne({ userId, videoId }).session(
            session,
          );

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: -1 } },
          ).session(session);

          if (!resp3) {
            throw new Error('Video not found');
          }
        } else if (resp1.likeStatus === 'DISLIKED') {
          // change dislike to like
          const resp2 = await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: 'LIKED' },
          ).session(session);

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: 1, dislikes: -1 } },
          ).session(session);
        } else if (resp1.likeStatus === 'NONE') {
          // mostly wont be there, since we delete when unliked
          // change none to like
          const resp2 = await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: 'LIKED' },
          ).session(session);

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: 1 } },
          ).session(session);
        }
      } else {
        // create new like
        const resp2 = await LikeModel.create(
          [
            {
              videoId,
              userId,
              likeStatus: 'LIKED',
            },
          ],
          { session },
        );

        const resp3 = await VideoModel.findOneAndUpdate(
          { _id: videoId },
          { $inc: { likes: 1 } },
        ).session(session);

        if (!resp3) {
          throw new Error('Video not found');
        }
      }

      await session.commitTransaction();
    } catch (error) {
      console.log('Error in likeVideo transaction', error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error('Error liking video', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

export const dislikeVideo = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    const session = await db.startSession();

    try {
      session.startTransaction();

      const resp1 = await LikeModel.findOne({ videoId, userId }).session(
        session,
      );

      if (resp1) {
        if (resp1.likeStatus === 'DISLIKED') {
          // already disliked, remove dislike
          const resp2 = await LikeModel.deleteOne({ userId, videoId }).session(
            session,
          );

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { dislikes: -1 } },
          ).session(session);

          if (!resp3) {
            throw new Error('Video not found');
          }
        } else if (resp1.likeStatus === 'LIKED') {
          // change like to dislike
          const resp2 = await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: 'DISLIKED' },
          ).session(session);

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: -1, dislikes: 1 } },
          ).session(session);
        } else if (resp1.likeStatus === 'NONE') {
          // change none to dislike
          const resp2 = await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: 'DISLIKED' },
          ).session(session);

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { dislikes: 1 } },
          ).session(session);
        }
      } else {
        // create new dislike
        const resp2 = await LikeModel.create(
          [
            {
              videoId,
              userId,
              likeStatus: 'DISLIKED',
            },
          ],
          { session },
        );

        const resp3 = await VideoModel.findOneAndUpdate(
          { _id: videoId },
          { $inc: { dislikes: 1 } },
        ).session(session);

        if (!resp3) {
          throw new Error('Video not found');
        }
      }

      await session.commitTransaction();
    } catch (error) {
      console.log('Error in dislikeVideo transaction', error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error('Error disliking video', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};
