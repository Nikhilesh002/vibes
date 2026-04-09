import { IUserDoc, UserModel } from "../models/user";
import { compareHash, createHash } from "../utils/server/bcryptjs";
import { logger } from "../utils/server/logger";
import { COOKIE_EXPIRY_DURATION, makeToken } from "../utils/server/jwt";
import { Response, Request } from "express";

export const userSignUp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await createHash(password);
    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
    });

    // make token and send
    res.cookie("auth_token", makeToken(username, user._id), {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: COOKIE_EXPIRY_DURATION * 1000,
    });

    return res.status(201).json({
      success: true,
      msg: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user", error);
    res.status(400).json({
      success: false,
      msg: "Failed to create user",
    });
  }
};

export const userSignIn = async (req: Request, res: Response): Promise<any> => {
  try {
    const { identifier, password } = req.body;

    const user = (await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    })) as IUserDoc | null;
    if (!user) {
      console.error("User not found");
      return res.status(400).json({
        success: false,
        msg: "User not found",
      });
    }

    const isMatch = await compareHash(password, user.password);
    if (!isMatch) {
      console.error("Invalid Password");
      return res.status(400).json({
        success: false,
        msg: "Invalid Password",
      });
    }

    // make token and send
    res.cookie("auth_token", makeToken(user.username, user._id), {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: COOKIE_EXPIRY_DURATION * 1000,
    });

    return res.status(200).json({
      success: true,
      msg: "User signed in successfully",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error signing in user", error);
    res.status(400).json({
      success: false,
      msg: "Failed to sign in",
    });
  }
};

export const userSignOut = async (
  req: Request,
  res: Response
): Promise<any> => {
  console.log("User signed out");
  return res.clearCookie("auth_token").status(200).json({
    success: true,
    msg: "User signed out successfully",
  });
};
