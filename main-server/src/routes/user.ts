import { Router } from "express";
import { userSignIn, userSignOut, userSignUp } from "../controllers/user";
import { validateInput } from "../middlewares/validateInput";
import { signupSchema, signinSchema } from "../validations/schemas";
import { rateLimit } from "../utils/server/rateLimiter";

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,           // 10 attempts per window
  keyPrefix: "auth",
});

const userRouter: any = Router();

userRouter.post("/signup", authRateLimit, validateInput(signupSchema), userSignUp);
userRouter.post("/signin", authRateLimit, validateInput(signinSchema), userSignIn);
userRouter.get("/signout", userSignOut);

export default userRouter;
