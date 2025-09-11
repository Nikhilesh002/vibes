import { Router } from 'express';
import { validateAuth } from '../middlewares/validateAuth';
import { getLogs } from '../controllers/logs';

const logsRouter: any = Router();

logsRouter.get('/', validateAuth, getLogs);
// logsRouter.post("/", validateAuth);

export default logsRouter;
