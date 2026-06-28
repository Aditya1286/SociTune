import { Router } from "express";
import { Routes } from "../typings/routes.js";
import InternalNotificationController from "../controllers/internalNotification.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class InternalNotificationRoutes implements Routes {
    public path = '/internal/notifications';
    public router = Router();
    public internalController = Singleton.instance<InternalNotificationController>(InternalNotificationController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/create`,
            this.authMiddleware.verifyServiceToken,
            asyncHandler(this.internalController.createNotification)
        );
        this.router.post(
            `${this.path}/message`,
            this.authMiddleware.verifyServiceToken,
            asyncHandler(this.internalController.createMessageNotification)
        );
        this.router.post( 
            `${this.path}/read-messages`,
            this.authMiddleware.verifyServiceToken,
            asyncHandler(this.internalController.readMessagesNotification)
        );
    }
}

export default InternalNotificationRoutes;
