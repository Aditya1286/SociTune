import { clerkClient } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAIL, INTERNAL_SERVICE_TOKEN } from '../config/index.js';

class AuthMiddleware {
  public verifyServiceToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['x-service-token'];
    if (!token || token !== INTERNAL_SERVICE_TOKEN) {
      return res.status(401).json({ message: "Unauthorized - Invalid service token" });
    }
    next();
  }
  public async protectRoute(req: Request, res: Response, next: NextFunction) {
    const auth = (req as any).auth;
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: "Unauthorized - you must be logged in" });
    }
    next();
  }

  public async requireAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = (req as any).auth;
      if (!auth || !auth.userId) {
        return res.status(401).json({ message: "Unauthorized - you must be logged in" });
      }
      const currentUser = await clerkClient.users.getUser(auth.userId);
      const isAdmin = ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress;
      if (!isAdmin) {
        return res.status(403).json({ message: "Unauthorized - you must be admin " });
      }
      next();
    } catch (error) {
      next(error);
    }
  }
}

export default AuthMiddleware;