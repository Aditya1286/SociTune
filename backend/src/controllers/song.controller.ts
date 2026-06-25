import { Request, Response, NextFunction } from "express";
import { Song } from "../models/song.model.js";
import Singleton from "../utils/Singleton.js";
import LyricsService from "../services/lyrics.service.js";

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
                { $sample: { size: 12 } },
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
                { $sample: { size: 12 } },
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

    public async getSongLyrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const song = await Song.findById(id);
            if (!song) {
                return res.status(404).json({ message: "Song not found" });
            }

            // If lyrics are not cached, or previously failed/empty, fetch and save them on-the-fly
            if (song.lyrics === null || song.lyrics === "" || song.lyricsSource === "None") {
                console.log(`[SongController] Lyrics not cached for "${song.title}". Fetching on-the-fly...`);
                const lyricsService = Singleton.instance<LyricsService>(LyricsService);
                await lyricsService.fetchAndSaveLyrics(id as string);

                // Reload the song document to get the newly generated lyrics
                const updatedSong = await Song.findById(id);
                if (updatedSong) {
                    return res.json({
                        lyrics: updatedSong.lyrics || null,
                        lyricsSource: updatedSong.lyricsSource || null,
                        lyricsFetchedAt: updatedSong.lyricsFetchedAt || null
                    });
                }
            }

            res.json({
                lyrics: song.lyrics || null,
                lyricsSource: song.lyricsSource || null,
                lyricsFetchedAt: song.lyricsFetchedAt || null
            });
        } catch (error) {
            next(error);
        }
    }

    public async getSongById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const song = await Song.findById(id);
            if (!song) {
                return res.status(404).json({ message: "Song not found" });
            }
            res.json(song);
        } catch (error) {
            next(error);
        }
    }
}

export default SongController;