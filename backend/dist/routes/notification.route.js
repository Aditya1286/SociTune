import { Router } from "express";
import NotificationController from "../controllers/notification.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class NotificationRoutes {
    path = '/api/notifications';
    router = Router();
    notificationController = Singleton.instance(NotificationController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/`, this.authMiddleware.protectRoute, asyncHandler(this.notificationController.getNotifications));
        this.router.put(`${this.path}/read-all`, this.authMiddleware.protectRoute, asyncHandler(this.notificationController.markAllRead));
        this.router.put(`${this.path}/:id/read`, this.authMiddleware.protectRoute, asyncHandler(this.notificationController.markRead));
        this.router.delete(`${this.path}/:id`, this.authMiddleware.protectRoute, asyncHandler(this.notificationController.deleteNotification));
    }
}
export default NotificationRoutes;
