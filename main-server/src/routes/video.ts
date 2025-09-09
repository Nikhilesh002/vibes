import { Router } from 'express';
import {
  transcodeVideo,
  preSignedUrl,
  allVideos,
  getVideoById,
} from '../controllers/video';
import { validateAuth } from '../middlewares/validateAuth';

const videoRouter: any = Router();

videoRouter.post('/presignedurl', validateAuth, preSignedUrl);
videoRouter.post('/transcode', validateAuth, transcodeVideo);
videoRouter.get('/', validateAuth, allVideos);
videoRouter.get('/:videoId', validateAuth, getVideoById);

export default videoRouter;
