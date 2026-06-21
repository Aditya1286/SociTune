import { Song } from "../models/song.model.js";
class SongController {
    async getAllSongs(req, res, next) {
        try {
            const songs = await Song.find().sort({ createdAt: -1 });
            res.json(songs);
        }
        catch (error) {
            next(error);
        }
    }
    async getFeaturedSongs(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async getMadeForYouSongs(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async getTrendingSongs(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async searchSongs(req, res, next) {
        try {
            const { q } = req.query;
            if (!q)
                return res.json([]);
            const songs = await Song.find({
                $or: [
                    { title: { $regex: q, $options: "i" } },
                    { artist: { $regex: q, $options: "i" } }
                ]
            }).limit(10);
            res.json(songs);
        }
        catch (error) {
            next(error);
        }
    }
    async getSongLyrics(req, res, next) {
        try {
            const { id } = req.params;
            const song = await Song.findById(id);
            if (!song) {
                return res.status(404).json({ message: "Song not found" });
            }
            res.json({
                lyrics: song.lyrics || null,
                lyricsSource: song.lyricsSource || null,
                lyricsFetchedAt: song.lyricsFetchedAt || null
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export default SongController;
