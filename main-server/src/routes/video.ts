import { Router } from 'express';
import {
  preSignedUrl,
  allVideos,
  getVideoById,
  likeVideo,
  dislikeVideo,
} from '../controllers/video';
import { validateAuth } from '../middlewares/validateAuth';

const videoRouter: any = Router();

videoRouter.post('/presignedurl', validateAuth, preSignedUrl);
videoRouter.get('/', validateAuth, allVideos);
videoRouter.put('/:videoId/like', validateAuth, likeVideo);
videoRouter.put('/:videoId/dislike', validateAuth, dislikeVideo);
videoRouter.get('/:videoId', validateAuth, getVideoById);

export default videoRouter;
