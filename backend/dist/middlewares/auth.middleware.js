import jwt from 'jsonwebtoken';
import { ADMIN_EMAIL, INTERNAL_SERVICE_TOKEN, JWT_SECRET } from '../config/index.js';
import { User } from '../models/user.model.js';
class AuthMiddleware {
    verifyServiceToken(req, res, next) {
        const token = req.headers['x-service-token'];
        if (!token || token !== INTERNAL_SERVICE_TOKEN) {
            return res.status(401).json({ message: "Unauthorized - Invalid service token" });
        }
        next();
    }
    async protectRoute(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Unauthorized - missing or invalid token format" });
            }
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findOne({ clerkId: decoded.userId });
            if (!user) {
                return res.status(401).json({ message: "Unauthorized - user not found" });
            }
            req.user = user;
            // Maintain compatibility with any endpoint reading (req as any).auth.userId
            req.auth = { userId: user.clerkId };
            next();
        }
        catch (error) {
            console.error("Token verification error:", error);
            return res.status(401).json({ message: "Unauthorized - token invalid or expired" });
        }
    }
    async requireAdmin(req, res, next) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: "Unauthorized - you must be logged in" });
            }
            const isAdmin = ADMIN_EMAIL === user.email || ADMIN_EMAIL === user.fullName;
            if (!isAdmin) {
                return res.status(403).json({ message: "Unauthorized - you must be admin" });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    }
}
export default AuthMiddleware;
