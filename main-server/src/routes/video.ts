import { Router } from "express";
import { transcodeVideo, preSignedUrl, allVideos } from "../controllers/video";
import { validateAuth } from "../middlewares/validateAuth";

const videoRouter: any = Router();

videoRouter.post("/presignedurl", validateAuth, preSignedUrl);
videoRouter.post("/transcode", validateAuth, transcodeVideo);
videoRouter.get("/", validateAuth, allVideos);

export default videoRouter;
