import { Request, Response, NextFunction } from 'express';

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).user) {
    return next();
  }
  res.redirect('/login');
};

export const roleCheck = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req.session as any).user;
    if (user && roles.includes(user.role)) {
      return next();
    }

    if (req.session) {
      (req.session as any).error = "You don't have permission to access this resource";
    }
    res.redirect('back');
  };
};
