import { Router } from 'express';
import { validateAuth } from '../middlewares/validateAuth';
import {
  deleteComment,
  getComments,
  postComment,
} from '../controllers/comments';

const commentsRouter: any = Router();

commentsRouter.get('/:videoId', getComments);
commentsRouter.post('/:videoId', validateAuth, postComment);
commentsRouter.delete('/:commentId', validateAuth, deleteComment);

export default commentsRouter;
