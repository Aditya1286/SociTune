import { Router } from "express";
import { Routes } from "../typings/routes.js";
import NotificationController from "../controllers/notification.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class NotificationRoutes implements Routes {
    public path = '/api/notifications';
    public router = Router();
    public notificationController = Singleton.instance<NotificationController>(NotificationController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            `${this.path}/`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.notificationController.getNotifications)
        );
        this.router.put(
            `${this.path}/read-all`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.notificationController.markAllRead)
        );
        this.router.put(
            `${this.path}/:id/read`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.notificationController.markRead)
        );
        this.router.delete(
            `${this.path}/:id`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.notificationController.deleteNotification)
        );
    }
}

export default NotificationRoutes;
