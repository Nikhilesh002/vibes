import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateInput(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): any => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        msg: 'Validation failed',
        errors,
      });
    }

    next();
  };
}
