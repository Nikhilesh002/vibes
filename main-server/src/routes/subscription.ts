import { Router } from 'express';
import { validateAuth } from '../middlewares/validateAuth';
import {
  getCreatorSubscribersCount,
  getUserSubscriptions,
  subscribeToCreator,
} from '../controllers/subscription';

const subscriptionRouter: any = Router();

subscriptionRouter.get('/user/:userId', validateAuth, getUserSubscriptions);
subscriptionRouter.get(
  '/creator/:creatorId/count',
  validateAuth,
  getCreatorSubscribersCount,
);
subscriptionRouter.post('/', validateAuth, subscribeToCreator);

export default subscriptionRouter;
