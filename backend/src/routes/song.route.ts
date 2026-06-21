import { Router } from "express";
import { Routes } from "../typings/routes.js";
import SongController from "../controllers/song.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class SongRoutes implements Routes {
    public path = '/api/songs';
    public router = Router();
    public songController = Singleton.instance<SongController>(SongController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            `${this.path}/`,
            this.authMiddleware.protectRoute,
            this.authMiddleware.requireAdmin,
            asyncHandler(this.songController.getAllSongs)
        );
        this.router.get(
            `${this.path}/featured`,
            asyncHandler(this.songController.getFeaturedSongs)
        );
        this.router.get(
            `${this.path}/made-for-you`,
            asyncHandler(this.songController.getMadeForYouSongs)
        );
        this.router.get(
            `${this.path}/trending`,
            asyncHandler(this.songController.getTrendingSongs)
        );
        this.router.get(
            `${this.path}/search`,
            asyncHandler(this.songController.searchSongs)
        );
    }
}

export default SongRoutes;