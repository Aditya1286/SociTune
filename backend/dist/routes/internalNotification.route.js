import { Router } from "express";
import InternalNotificationController from "../controllers/internalNotification.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class InternalNotificationRoutes {
    path = '/internal/notifications';
    router = Router();
    internalController = Singleton.instance(InternalNotificationController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/create`, this.authMiddleware.verifyServiceToken, asyncHandler(this.internalController.createNotification));
        this.router.post(`${this.path}/message`, this.authMiddleware.verifyServiceToken, asyncHandler(this.internalController.createMessageNotification));
        this.router.post(`${this.path}/read-messages`, this.authMiddleware.verifyServiceToken, asyncHandler(this.internalController.readMessagesNotification));
    }
}
export default InternalNotificationRoutes;
