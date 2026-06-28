import { Router } from "express";
import AdminController from "../controllers/admin.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class AdminRoutes {
    path = '/api/admin';
    router = Router();
    adminController = Singleton.instance(AdminController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/songs`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.adminController.createSong));
        this.router.delete(`${this.path}/songs/:id`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.adminController.deleteSong));
        this.router.get(`${this.path}/check`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.adminController.checkAdmin));
        this.router.post(`${this.path}/albums`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.adminController.createAlbum));
        this.router.delete(`${this.path}/albums/:id`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.adminController.deleteAlbum));
    }
}
export default AdminRoutes;
