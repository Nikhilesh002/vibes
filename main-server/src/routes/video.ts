import { Router } from "express";
import {
  preSignedUrl,
  allVideos,
  getVideoById,
  likeVideo,
  dislikeVideo,
} from "../controllers/video";
import { validateAuth } from "../middlewares/validateAuth";
import { validateInput } from "../middlewares/validateInput";
import { presignedUrlSchema, videoIdParamSchema } from "../validations/schemas";

const videoRouter: any = Router();

videoRouter.post(
  "/presignedurl",
  validateAuth,
  validateInput(presignedUrlSchema),
  preSignedUrl,
);
videoRouter.get("/", allVideos);
videoRouter.put(
  "/:videoId/like",
  validateAuth,
  validateInput(videoIdParamSchema),
  likeVideo,
);
videoRouter.put(
  "/:videoId/dislike",
  validateAuth,
  validateInput(videoIdParamSchema),
  dislikeVideo,
);
videoRouter.get(
  "/:videoId",
  validateAuth,
  validateInput(videoIdParamSchema),
  getVideoById,
);

export default videoRouter;
