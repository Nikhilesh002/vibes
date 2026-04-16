import { Request, Response } from "express";

import {
  getPresignedUrl,
  getStreamingSasToken,
  makePresignedUrl,
} from "../utils/azureBlob/makePresignedUrl";
import { envs } from "../configs";
import { VideoModel } from "../models/video";
import { LikeModel } from "../models/like";
import { recordView } from "../utils/redis/viewCounter";
import { db } from "../configs/db";

export async function preSignedUrl(req: Request, res: Response): Promise<any> {
  try {
    const { videoKey, thumbnailKey, title, description, tags } = req.body;

    const { url: videoUrl, sasKey: videoSasKey } = makePresignedUrl(
      "tempbucket",
      videoKey,
      "c",
    );
    const { url: thumbnailUrl, sasKey: thumbnailSasKey } = makePresignedUrl(
      "thumbnail",
      thumbnailKey,
      "c",
    );

    const resp = await VideoModel.create({
      blobName: videoKey,
      title,
      description,
      tags,
      tempUrl: videoUrl,
      thumbnailUrl,
      status: "PENDING",
      logs: "",
      transcodedVideoUrl: "",
      completedAt: 0,
      userId: req.userId,
    } as any);

    return res.status(200).json({
      success: true,
      videoUrl,
      videoSasKey,
      thumbnailUrl,
      thumbnailSasKey,
      videoId: resp._id,
    });
  } catch (error) {
    console.error("Error creating signed URL", error);
    res.status(400).json({
      success: false,
      msg: "Failed to create signed URL",
    });
  }
}

export const searchVideos = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const q = req.query.q as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const filter: any = { $text: { $search: q } };
    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const videos = await VideoModel.find(filter, {
      score: { $meta: "textScore" },
    })
      .sort({ score: { $meta: "textScore" }, _id: -1 })
      .limit(limit + 1)
      .select("-logs -__v -transcodedVideoUrl -tempUrl");

    const hasMore = videos.length > limit;
    if (hasMore) videos.pop();

    videos.forEach((video: any) => {
      if (!video) return;
      if (video.thumbnailUrl.includes(".blob.core.windows.net/"))
        video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, "r");
    });

    return res.json({
      success: true,
      videos,
      nextCursor: hasMore ? videos[videos.length - 1]._id : null,
    });
  } catch (error) {
    console.error("Error searching videos", error);
    res.status(400).json({
      success: false,
      msg: "Failed to search videos",
    });
  }
};

export const allVideos = async (req: Request, res: Response): Promise<any> => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const filter: any = {};
    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const videos = await VideoModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1) // fetch one extra to check if there's a next page
      .select("-logs -__v -transcodedVideoUrl -tempUrl");

    const hasMore = videos.length > limit;
    if (hasMore) videos.pop(); // remove the extra

    videos.forEach((video: any) => {
      if (!video) return;
      if (video.thumbnailUrl.includes(".blob.core.windows.net/"))
        video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, "r");
    });

    return res.json({
      success: true,
      videos,
      nextCursor: hasMore ? videos[videos.length - 1]._id : null,
    });
  } catch (error) {
    console.error("Error getting videos", error);
    res.status(400).json({
      success: false,
      msg: "Failed to fetch videos",
    });
  }
};

export const getVideoById = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const videoId = req.params.videoId as string;
    const userId = req.userId;

    // Deduplicated view count — only increments once per user per 24 hours
    const isNewView = await recordView(videoId, userId);

    const video = await VideoModel.findByIdAndUpdate(
      videoId,
      isNewView ? { $inc: { views: 1 } } : {},
      { returnDocument: "after" },
    ).populate("userId", "username avatarUrl");
    if (!video) {
      return res.status(400).json({
        success: false,
        msg: "Video not found",
      });
    }

    const like = await LikeModel.findOne({
      videoId,
      userId,
    } as any);

    if (video.thumbnailUrl.includes(".blob.core.windows.net/"))
      video.thumbnailUrl = getPresignedUrl(video.thumbnailUrl, "r");

    // Generate a 4-hour read-only SAS token for HLS streaming.
    // Returned separately because HLS relative URL resolution strips query
    // params — the client must append this token to every sub-request.
    let transcodedVideoSasToken = "";
    if (video.transcodedVideoUrl.includes(".blob.core.windows.net/")) {
      transcodedVideoSasToken = getStreamingSasToken(
        envs.destinationContainer,
      );
    }

    const populatedUser: any = video.userId;

    return res.json({
      success: true,
      video: {
        ...video.toObject(),
        transcodedVideoSasToken,
        userId: populatedUser._id,
        creatorName: populatedUser.username,
        creatorAvatar: populatedUser.avatarUrl,
      },
      likeStatus: like ? like.likeStatus : "NONE",
    });
  } catch (error) {
    console.error("Error getting video by id", error);
    res.status(400).json({
      success: false,
      msg: "Failed to fetch video",
    });
  }
};

export const likeVideo = async (req: Request, res: Response): Promise<any> => {
  try {
    const videoId = req.params.videoId as string;
    const userId = req.userId;

    const session = await db.startSession();

    try {
      session.startTransaction();

      const resp1 = await LikeModel.findOne({
        videoId,
        userId,
      } as any).session(session);

      if (resp1) {
        if (resp1.likeStatus === "LIKED") {
          await LikeModel.deleteOne({
            userId,
            videoId,
          } as any).session(session);

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: -1 } },
          ).session(session);

          if (!resp3) {
            throw new Error("Video not found");
          }
        } else if (resp1.likeStatus === "DISLIKED") {
          await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: "LIKED" },
          ).session(session);

          await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: 1, dislikes: -1 } },
          ).session(session);
        } else if (resp1.likeStatus === "NONE") {
          await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: "LIKED" },
          ).session(session);

          await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: 1 } },
          ).session(session);
        }
      } else {
        await LikeModel.create(
          [
            {
              videoId,
              userId,
              likeStatus: "LIKED",
            },
          ] as any,
          { session },
        );

        const resp3 = await VideoModel.findOneAndUpdate(
          { _id: videoId },
          { $inc: { likes: 1 } },
        ).session(session);

        if (!resp3) {
          throw new Error("Video not found");
        }
      }

      await session.commitTransaction();
    } catch (error) {
      console.log("Error in likeVideo transaction", error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Error liking video", error);
    res.status(400).json({
      success: false,
      msg: "Failed to like video",
    });
  }
};

export const dislikeVideo = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const videoId = req.params.videoId as string;
    const userId = req.userId;

    const session = await db.startSession();

    try {
      session.startTransaction();

      const resp1 = await LikeModel.findOne({
        videoId,
        userId,
      } as any).session(session);

      if (resp1) {
        if (resp1.likeStatus === "DISLIKED") {
          await LikeModel.deleteOne({
            userId,
            videoId,
          } as any).session(session);

          const resp3 = await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { dislikes: -1 } },
          ).session(session);

          if (!resp3) {
            throw new Error("Video not found");
          }
        } else if (resp1.likeStatus === "LIKED") {
          await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: "DISLIKED" },
          ).session(session);

          await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { likes: -1, dislikes: 1 } },
          ).session(session);
        } else if (resp1.likeStatus === "NONE") {
          await LikeModel.updateOne(
            { _id: resp1._id },
            { likeStatus: "DISLIKED" },
          ).session(session);

          await VideoModel.findOneAndUpdate(
            { _id: videoId },
            { $inc: { dislikes: 1 } },
          ).session(session);
        }
      } else {
        await LikeModel.create(
          [
            {
              videoId,
              userId,
              likeStatus: "DISLIKED",
            },
          ] as any,
          { session },
        );

        const resp3 = await VideoModel.findOneAndUpdate(
          { _id: videoId },
          { $inc: { dislikes: 1 } },
        ).session(session);

        if (!resp3) {
          throw new Error("Video not found");
        }
      }

      await session.commitTransaction();
    } catch (error) {
      console.log("Error in dislikeVideo transaction", error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Error disliking video", error);
    res.status(400).json({
      success: false,
      msg: "Failed to dislike video",
    });
  }
};
