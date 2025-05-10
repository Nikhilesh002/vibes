import { Request, Response } from "express";
import { makePresignedUrl } from "../utils/azureBlob/makePresignedUrl";
import { VideoJobModel } from "../models/videoJob";
import Redis from "ioredis";
import { UserModel } from "../models/user";
// import { makePreSignedUrl } from "../utils/s3/makePreSignedUrl";

export async function preSignedUrl(req: Request, res: Response): Promise<any> {
  try {
    // u get metadata of video

    const { key, title, description, tags } = req.body;

    // use tempbucket
    const { url, sasKey } = makePresignedUrl("tempbucket", key);

    // store url in db
    const resp = await VideoJobModel.create({
      blobName: key,
      title,
      description,
      tags,
      tempUrl:url,
      userId: req.userId,
    });

    await UserModel.updateOne(
      { _id: req.userId },
      { $push: { videoJobIds: resp._id } }
    );

    return res
      .status(200)
      .json({ success: true, url, sasKey, videoJobId: resp._id });
  } catch (error) {
    console.error("Error creating signed URL", error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
}

export const transcodeVideo = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { videoUrl, videoJobId } = req.body;
    const job = JSON.stringify({ videoUrl, videoJobId });

    // publish job in queue
    const redis = new Redis(process.env.REDIS_URL ?? "");
    await redis.lpush("VIDEO_TRANSCODING_PENDING", job);
    console.log(`REDIS: job: VIDEO_TRANSCODING_PENDING - ${job}`);

    // update status in db
    await VideoJobModel.updateOne(
      { _id: videoJobId },
      { $set: { status: "IN_QUEUE" } }
    );

    res.status(200).json({
      success: true,
      msg: "Added to Queue",
    });
  } catch (error) {
    console.error("Error publishing job", error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};

export const allVideos = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await UserModel.findOne({ _id: req.userId }).populate({
      path: "videoJobIds",
      match: {
        status: "DONE",
      },
    });
    if (!user) {
      console.error("User not found!!");
      return res.status(400).json({
        success: false,
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error getting videos", error);
    res.status(400).json({
      success: false,
      msg: error,
    });
  }
};
