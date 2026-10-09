import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        if (req.session) {
            (req.session as any).error = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        }
        return res.redirect('back');
      }
      next(error);
    }
  };
};
