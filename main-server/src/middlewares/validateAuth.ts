import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/server/jwt";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const validateAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const token = req.cookies.auth_token;
  const payload = verifyToken(token);

  if (!payload || typeof payload === "string" || payload.userId === undefined) {
    return res.status(401).json({
      success: false,
      data: "Unauthorized",
    });
  }

  req.userId = payload.userId;
  next();
};
