import { Router } from "express";
import { validateAuth } from "../middlewares/validateAuth";
import {
  getCreatorSubscribersCount,
  getUserSubscriptions,
  subscribeToCreator,
} from "../controllers/subscription";
import { validateInput } from "../middlewares/validateInput";
import {
  userIdParamSchema,
  creatorIdParamSchema,
  subscribeSchema,
} from "../validations/schemas";

const subscriptionRouter: any = Router();

subscriptionRouter.get(
  "/user/:userId",
  validateAuth,
  validateInput(userIdParamSchema),
  getUserSubscriptions,
);
subscriptionRouter.get(
  "/creator/:creatorId/count",
  validateAuth,
  validateInput(creatorIdParamSchema),
  getCreatorSubscribersCount,
);
subscriptionRouter.post(
  "/",
  validateAuth,
  validateInput(subscribeSchema),
  subscribeToCreator,
);

export default subscriptionRouter;
