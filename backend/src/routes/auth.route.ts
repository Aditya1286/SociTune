import { Router } from "express";
import { Routes } from "../typings/routes.js";
import AuthController from "../controllers/auth.controller.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class AuthRoutes implements Routes {
    public path = '/api/auth';
    public router = Router();
    public authController = Singleton.instance<AuthController>(AuthController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/callback`,
            asyncHandler(this.authController.authCallback)
        );
    }
}

export default AuthRoutes;