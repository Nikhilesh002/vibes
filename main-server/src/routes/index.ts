import {Router} from "express";
import userRouter from "./user";
import videoRouter from "./video";
import videoTranscodingLogsRouter from "./videoTranscodingLogs";
import subscriptionRouter from "./subscription";
import commentRouter from "./comments";

const router:any = Router();

router.use("/user", userRouter);
router.use("/video", videoRouter);
router.use("/logs", videoTranscodingLogsRouter);
router.use("/subscription", subscriptionRouter);
router.use("/comments", commentRouter);

export default router;
