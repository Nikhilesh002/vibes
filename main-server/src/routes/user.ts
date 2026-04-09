import { Router } from "express";
import { userSignIn, userSignOut, userSignUp } from "../controllers/user";
import { validateInput } from "../middlewares/validateInput";
import { signupSchema, signinSchema } from "../validations/schemas";

const userRouter: any = Router();

userRouter.post("/signup", validateInput(signupSchema), userSignUp);
userRouter.post("/signin", validateInput(signinSchema), userSignIn);
userRouter.get("/signout", userSignOut);

export default userRouter;
