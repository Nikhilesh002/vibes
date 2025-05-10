import {Router} from "express";
import userRouter from "./user";
import videoRouter from "./video";

const router:any = Router();

router.use("/user", userRouter);
router.use("/video", videoRouter);

export default router;
