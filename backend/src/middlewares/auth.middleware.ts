import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ADMIN_EMAIL, INTERNAL_SERVICE_TOKEN, JWT_SECRET } from '../config/index.js';
import { User } from '../models/user.model.js';

class AuthMiddleware {
  public verifyServiceToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['x-service-token'];
    if (!token || token !== INTERNAL_SERVICE_TOKEN) {
      return res.status(401).json({ message: "Unauthorized - Invalid service token" });
    }
    next();
  }

  public protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token = req.cookies?.token;
      if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({ message: "Unauthorized - you must be logged in" });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }

      (req as any).auth = { userId: decoded.userId };
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
    }
  };

  public requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as any).auth;
      if (!auth || !auth.userId) {
        return res.status(401).json({ message: "Unauthorized - you must be logged in" });
      }

      const currentUser = await User.findOne({ clerkId: auth.userId });
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const isAdmin = ADMIN_EMAIL === currentUser.email;
      if (!isAdmin) {
        return res.status(403).json({ message: "Unauthorized - you must be admin " });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default AuthMiddleware;