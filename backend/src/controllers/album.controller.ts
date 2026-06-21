import { Request, Response, NextFunction } from "express";
import { Album } from "../models/album.model.js";

class AlbumController {
    public async getAllAlbums(req: Request, res: Response, next: NextFunction) {
        try {
            const albums = await Album.find();
            res.status(200).json(albums);
        } catch (error) {
            console.log("Error for getting all the album", error);
            next(error);
        }
    }

    public async getAlbumById(req: Request, res: Response, next: NextFunction) {
        try {
            const { albumId } = req.params;
            const album = await Album.findById(albumId).populate("songs");
            if (!album) {
                return res.status(404).json({ message: "Album not found" });
            }
            res.status(200).json(album);
        } catch (error) {
            console.log("Error for getting the particular album", error);
            next(error);
        }
    }
}

export default AlbumController;