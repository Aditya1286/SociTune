import { Router } from "express";
import { Routes } from "../typings/routes.js";
import AdminController from "../controllers/admin.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class AdminRoutes implements Routes {
    public path = '/api/admin';
    public router = Router();
    public adminController = Singleton.instance<AdminController>(AdminController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/songs`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.adminController.createSong)
        );
        this.router.delete(
            `${this.path}/songs/:id`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.adminController.deleteSong)
        );
        this.router.get(
            `${this.path}/check`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.adminController.checkAdmin)
        );
        this.router.post(
            `${this.path}/albums`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.adminController.createAlbum)
        );
        this.router.delete(
            `${this.path}/albums/:id`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.adminController.deleteAlbum)
        );
    }
}

export default AdminRoutes;