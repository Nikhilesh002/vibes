import { Router } from 'express';
import { validateAuth } from '../middlewares/validateAuth';
import { getLogs } from '../controllers/videoTranscodingLogs';

const logsRouter: any = Router();

logsRouter.get('/:videoId', validateAuth, getLogs);
// logsRouter.post("/", validateAuth);

export default logsRouter;
