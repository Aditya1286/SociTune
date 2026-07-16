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
        this.router.post(`${this.path}/register`, asyncHandler(this.authController.register));
        this.router.post(`${this.path}/login`, asyncHandler(this.authController.login));
        this.router.post(`${this.path}/google`, asyncHandler(this.authController.googleLogin));
        this.router.post(`${this.path}/logout`, asyncHandler(this.authController.logout));
        this.router.post(`${this.path}/callback`, asyncHandler(this.authController.authCallback));
    }
}
export default AuthRoutes;
