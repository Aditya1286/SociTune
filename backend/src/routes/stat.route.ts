import { Router } from "express";
import { Routes } from "../typings/routes.js";
import StatController from "../controllers/stat.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class StatRoutes implements Routes {
    public path = '/api/stats';
    public router = Router();
    public statController = Singleton.instance<StatController>(StatController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            `${this.path}/`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.statController.getStats)
        );
    }
}

export default StatRoutes;