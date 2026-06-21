import { Request, Response, NextFunction } from "express";
import { Album } from "../models/album.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";

class StatController {
    public async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const [totalSongs, totalAlbums, totalUsers, uniqueArtists] = await Promise.all([
                Song.countDocuments(),
                Album.countDocuments(),
                User.countDocuments(),

                Song.aggregate([
                    {
                        $unionWith: {
                            coll: "albums",
                            pipeline: [],
                        },
                    },
                    {
                        $group: {
                            _id: "$artist",
                        },
                    },
                    {
                        $count: "count",
                    },
                ]),
            ]);

            res.status(200).json({
                totalAlbums,
                totalSongs,
                totalUsers,
                totalArtists: uniqueArtists[0]?.count || 0,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default StatController;