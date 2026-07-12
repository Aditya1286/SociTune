import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class AuthRoutes {
    path = '/api/auth';
    router = Router();
    authController = Singleton.instance(AuthController);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/signup`, asyncHandler(this.authController.signup));
        this.router.post(`${this.path}/login`, asyncHandler(this.authController.login));
        this.router.post(`${this.path}/callback`, asyncHandler(this.authController.authCallback));
    }
}
export default AuthRoutes;
