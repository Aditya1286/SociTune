import { Router } from "express";
import { Routes } from "../typings/routes.js";
import SpotifyController from "../controllers/spotify.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class SpotifyRoutes implements Routes {
    public path = '/api/spotify';
    public router = Router();
    public spotifyController = Singleton.instance<SpotifyController>(SpotifyController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/exchange`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.spotifyController.exchangeCode)
        );
        this.router.get(
            `${this.path}/token`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.spotifyController.getToken)
        );
        this.router.all(
            `${this.path}/proxy`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.spotifyController.proxy)
        );
    }
}

export default SpotifyRoutes;
