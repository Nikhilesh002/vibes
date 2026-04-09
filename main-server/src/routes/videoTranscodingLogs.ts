import { Router } from "express";
import { validateAuth } from "../middlewares/validateAuth";
import { getLogs } from "../controllers/videoTranscodingLogs";
import { validateInput } from "../middlewares/validateInput";
import { logsParamSchema } from "../validations/schemas";

const logsRouter: any = Router();

logsRouter.get(
  "/:videoId",
  validateAuth,
  validateInput(logsParamSchema),
  getLogs,
);
// logsRouter.post("/", validateAuth);

export default logsRouter;
