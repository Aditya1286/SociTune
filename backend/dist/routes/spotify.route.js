import { Router } from "express";
import SpotifyController from "../controllers/spotify.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class SpotifyRoutes {
    path = '/api/spotify';
    router = Router();
    spotifyController = Singleton.instance(SpotifyController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/exchange`, this.authMiddleware.protectRoute, asyncHandler(this.spotifyController.exchangeCode));
        this.router.get(`${this.path}/token`, this.authMiddleware.protectRoute, asyncHandler(this.spotifyController.getToken));
        this.router.all(`${this.path}/proxy`, this.authMiddleware.protectRoute, asyncHandler(this.spotifyController.proxy));
    }
}
export default SpotifyRoutes;
