import { Request, Response } from 'express';
import {
  getPresignedUrl,
  makePresignedUrl,
} from '../utils/azureBlob/makePresignedUrl';
import { VideoJobModel } from '../models/videoJob';
import Redis from 'ioredis';
import { UserModel } from '../models/user';

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
    const resp = await VideoJobModel.create({
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

    await UserModel.updateOne(
      { _id: req.userId },
      { $push: { videoJobIds: resp._id } },
    );

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

export const transcodeVideo = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { videoUrl, videoJobId } = req.body;
    const job = JSON.stringify({ videoUrl, videoJobId });

    // publish job in queue
    const redis = new Redis(process.env.REDIS_URL ?? '');
    await redis.lpush('VIDEO_TRANSCODING_PENDING', job);
    console.log(`REDIS: job: VIDEO_TRANSCODING_PENDING - ${job}`);

    // update status in db
    await VideoJobModel.updateOne(
      { _id: videoJobId },
      { $set: { status: 'IN_QUEUE' } },
    );

    res.status(200).json({
      success: true,
      msg: 'Added to Queue',
    });
  } catch (error) {
    console.error('Error publishing job', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

export const allVideos = async (req: Request, res: Response): Promise<any> => {
  try {
    let user = await UserModel.findOne({ _id: req.userId }).populate({
      path: 'videoJobIds',
      match: {
        status: 'DONE',
      },
    });
    if (!user) {
      console.error('User not found!!');
      return res.status(400).json({
        success: false,
      });
    }

    user.videoJobIds.forEach((video: any) => {
      if (!video) return;
      if (video.thumbnailUrl.includes('.blob.core.windows.net/'))
        video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, 'r');

      if (video.transcodedVideoUrl.includes('.blob.core.windows.net/'))
        video.transcodedVideoUrl = getPresignedUrl(
          video.transcodedVideoUrl,
          'r',
        );
    });

    return res.json({
      success: true,
      user,
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
    const video = await VideoJobModel.findOne({
      _id: videoId,
      userId: req.userId,
    });
    if (!video) {
      console.error('Video not found!!');
      return res.status(400).json({
        success: false,
        msg: 'Video not found',
      });
    }

    if (video.thumbnailUrl.includes('.blob.core.windows.net/'))
      video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, 'r');

    // if (video.transcodedVideoUrl.includes('.blob.core.windows.net/'))
    //   video.transcodedVideoUrl = getPresignedUrl(video.transcodedVideoUrl, 'r');

    return res.json({
      success: true,
      ...video.toObject(),
    });
  } catch (error) {
    console.error('Error getting video by id', error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};
