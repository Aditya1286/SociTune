import { Router } from "express";
import StatController from "../controllers/stat.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class StatRoutes {
    path = '/api/stats';
    router = Router();
    statController = Singleton.instance(StatController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.statController.getStats));
    }
}
export default StatRoutes;
