import { Router } from "express";
import { Routes } from "../typings/routes.js";
import AlbumController from "../controllers/album.controller.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class AlbumRoutes implements Routes {
    public path = '/api/albums';
    public router = Router();
    public albumController = Singleton.instance<AlbumController>(AlbumController);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            `${this.path}/`,
            asyncHandler(this.albumController.getAllAlbums)
        );
        this.router.get(
            `${this.path}/:albumId`,
            asyncHandler(this.albumController.getAlbumById)
        );
    }
}

export default AlbumRoutes;