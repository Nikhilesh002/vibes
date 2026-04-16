import { Router } from "express";
import { userSignIn, userSignOut, userSignUp } from "../controllers/user";
import { validateInput } from "../middlewares/validateInput";
import { signupSchema, signinSchema } from "../validations/schemas";
import { rateLimit } from "../utils/server/rateLimiter";

// Signin: keyed by IP + identifier (username/email from body).
// Shared WiFi (300 students) — each can try 10 times with THEIR account.
// Attacker brute-forcing ONE account still capped at 10.
const signinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyPrefix: "signin",
  bodyField: "identifier",   // req.body.identifier (username or email)
});

// Signup: keyed by IP only (no identifier exists yet).
// 5/hour is generous — real users create 1 account ever.
const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyPrefix: "signup",
});

const userRouter: any = Router();

userRouter.post("/signup", signupRateLimit, validateInput(signupSchema), userSignUp);
userRouter.post("/signin", signinRateLimit, validateInput(signinSchema), userSignIn);
userRouter.get("/signout", userSignOut);

export default userRouter;
