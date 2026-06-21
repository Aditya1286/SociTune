import { Request, Response, NextFunction } from "express";
import { Song } from "../models/song.model.js";

class SongController {
    public async getAllSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.find().sort({ createdAt: -1 });
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getFeaturedSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.aggregate([
                { $sample: { size: 6 } },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        artist: 1,
                        imageUrl: 1,
                        audioUrl: 1
                    }
                }
            ]);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getMadeForYouSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.aggregate([
                { $sample: { size: 4 } },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        artist: 1,
                        imageUrl: 1,
                        audioUrl: 1
                    }
                }
            ]);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getTrendingSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.aggregate([
                { $sample: { size: 4 } },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        artist: 1,
                        imageUrl: 1,
                        audioUrl: 1
                    }
                }
            ]);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async searchSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const { q } = req.query;
            if (!q) return res.json([]);
            
            const songs = await Song.find({
                $or: [
                    { title: { $regex: q as string, $options: "i" } },
                    { artist: { $regex: q as string, $options: "i" } }
                ]
            }).limit(10);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }
}

export default SongController;