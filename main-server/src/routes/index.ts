import {Router} from "express";
import userRouter from "./user";
import videoRouter from "./video";
import logsRouter from "./logs";
import subscriptionRouter from "./subscription";

const router:any = Router();

router.use("/user", userRouter);
router.use("/video", videoRouter);
router.use("/logs", logsRouter);
router.use("/subscription", subscriptionRouter);

export default router;
