import jwt from "jsonwebtoken";
import { envs } from "../../configs";
import mongoose from "mongoose";

export const COOKIE_EXPIRY_DURATION = 60 * 60 * 24;
export const cookieExpiry = Math.floor(
  Date.now() / 1000 + COOKIE_EXPIRY_DURATION
);

export const makeToken = (
  username: string,
  userId: mongoose.Types.ObjectId
): string => {
  return jwt.sign(
    {
      username: username,
      userId: userId,
      exp: cookieExpiry,
      iat: Math.floor(Date.now() / 1000),
    },
    envs.jwtSecret
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, envs.jwtSecret);
  } catch (error) {
    return null;
  }
};
