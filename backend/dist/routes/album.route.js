import { Router } from "express";
import AlbumController from "../controllers/album.controller.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class AlbumRoutes {
    path = '/api/albums';
    router = Router();
    albumController = Singleton.instance(AlbumController);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/`, asyncHandler(this.albumController.getAllAlbums));
        this.router.get(`${this.path}/:albumId`, asyncHandler(this.albumController.getAlbumById));
    }
}
export default AlbumRoutes;
