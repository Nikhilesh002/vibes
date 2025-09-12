import { Router } from 'express';
import { validateAuth } from '../middlewares/validateAuth';

const commentsRouter: any = Router();

// commentsRouter.get('/:videoId', getComments);
// commentsRouter.post('/', validateAuth, postComment);
// commentsRouter.delete('/:commentId', validateAuth, deleteComment);

export default commentsRouter;
