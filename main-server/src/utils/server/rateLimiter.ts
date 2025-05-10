import { NextFunction, Request, Response } from "express";
import { IBucket } from "../../types/types";

const bucket: IBucket = {};

export const rateLimiter =
  async (timeGap: number, route: string) =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const key = req.ip + route;
    // rate limit at ip_route

    next();
  };
