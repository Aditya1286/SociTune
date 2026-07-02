import { clerkClient } from '@clerk/express';
import { ADMIN_EMAIL, INTERNAL_SERVICE_TOKEN } from '../config/index.js';
class AuthMiddleware {
    verifyServiceToken(req, res, next) {
        const token = req.headers['x-service-token'];
        if (!token || token !== INTERNAL_SERVICE_TOKEN) {
            return res.status(401).json({ message: "Unauthorized - Invalid service token" });
        }
        next();
    }
    async protectRoute(req, res, next) {
        const auth = req.auth;
        if (!auth || !auth.userId) {
            return res.status(401).json({ message: "Unauthorized - you must be logged in" });
        }
        next();
    }
    async requireAdmin(req, res, next) {
        try {
            const auth = req.auth;
            if (!auth || !auth.userId) {
                return res.status(401).json({ message: "Unauthorized - you must be logged in" });
            }
            const currentUser = await clerkClient.users.getUser(auth.userId);
            console.log("EMAIL", currentUser);
            const isAdmin = ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress; //Need to improve admin logic, can provide user object with a role's array.
            if (!isAdmin) {
                return res.status(403).json({ message: "Unauthorized - you must be admin " });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    }
}
export default AuthMiddleware;
