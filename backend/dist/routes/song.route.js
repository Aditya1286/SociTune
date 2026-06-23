import { Router } from "express";
import SongController from "../controllers/song.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class SongRoutes {
    path = '/api/songs';
    router = Router();
    songController = Singleton.instance(SongController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/`, this.authMiddleware.protectRoute, asyncHandler(this.songController.getAllSongs));
        this.router.get(`${this.path}/featured`, asyncHandler(this.songController.getFeaturedSongs));
        this.router.get(`${this.path}/made-for-you`, asyncHandler(this.songController.getMadeForYouSongs));
        this.router.get(`${this.path}/trending`, asyncHandler(this.songController.getTrendingSongs));
        this.router.get(`${this.path}/search`, asyncHandler(this.songController.searchSongs));
        this.router.get(`${this.path}/:id`, this.authMiddleware.protectRoute, asyncHandler(this.songController.getSongById));
        this.router.get(`${this.path}/:id/lyrics`, this.authMiddleware.protectRoute, asyncHandler(this.songController.getSongLyrics));
    }
}
export default SongRoutes;
