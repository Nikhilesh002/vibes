import { Router } from "express";
import { userSignIn, userSignOut, userSignUp } from "../controllers/user";

const userRouter: any = Router();

userRouter.post("/signup", userSignUp);
userRouter.post("/signin", userSignIn);
userRouter.get("/signout", userSignOut);

export default userRouter;

// /cronjob/authpin
