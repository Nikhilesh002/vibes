import { Router } from "express";
import {
  preSignedUrl,
  allVideos,
  searchVideos,
  getVideoById,
  likeVideo,
  dislikeVideo,
  deleteVideo,
} from "../controllers/video";
import { validateAuth } from "../middlewares/validateAuth";
import { validateInput } from "../middlewares/validateInput";
import {
  presignedUrlSchema,
  searchQuerySchema,
  videoIdParamSchema,
} from "../validations/schemas";
import { rateLimit } from "../utils/server/rateLimiter";

const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,           // 10 uploads per hour
  keyPrefix: "upload",
  useUserId: true,
});

const reactionRateLimit = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  maxRequests: 30,           // 30 reactions per minute
  keyPrefix: "reaction",
  useUserId: true,
});

const videoRouter: any = Router();

videoRouter.post(
  "/presignedurl",
  validateAuth,
  uploadRateLimit,
  validateInput(presignedUrlSchema),
  preSignedUrl,
);
videoRouter.get("/", allVideos);
videoRouter.get("/search", validateInput(searchQuerySchema), searchVideos);
videoRouter.put(
  "/:videoId/like",
  validateAuth,
  reactionRateLimit,
  validateInput(videoIdParamSchema),
  likeVideo,
);
videoRouter.put(
  "/:videoId/dislike",
  validateAuth,
  reactionRateLimit,
  validateInput(videoIdParamSchema),
  dislikeVideo,
);
videoRouter.get(
  "/:videoId",
  validateAuth,
  validateInput(videoIdParamSchema),
  getVideoById,
);
videoRouter.delete(
  "/:videoId",
  validateAuth,
  validateInput(videoIdParamSchema),
  deleteVideo,
);

export default videoRouter;
