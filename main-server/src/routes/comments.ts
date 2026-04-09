import { Router } from "express";
import { validateAuth } from "../middlewares/validateAuth";
import {
  deleteComment,
  getComments,
  postComment,
} from "../controllers/comments";
import { validateInput } from "../middlewares/validateInput";
import {
  getCommentsParamSchema,
  postCommentSchema,
  deleteCommentParamSchema,
} from "../validations/schemas";

const commentsRouter: any = Router();

commentsRouter.get(
  "/:videoId",
  validateInput(getCommentsParamSchema),
  getComments,
);
commentsRouter.post(
  "/:videoId",
  validateAuth,
  validateInput(postCommentSchema),
  postComment,
);
commentsRouter.delete(
  "/:commentId",
  validateAuth,
  validateInput(deleteCommentParamSchema),
  deleteComment,
);

export default commentsRouter;
