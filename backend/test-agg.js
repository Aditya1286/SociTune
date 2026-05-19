import mongoose from "mongoose";
import dotenv from "dotenv";
import { PlayHistory } from "./src/models/playHistory.model.js";

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const doc = await PlayHistory.findOne();
    console.log("Sample PlayHistory:", doc);
    
    if (doc) {
        const stats = await PlayHistory.aggregate([
            { $match: { userId: doc.userId } },
            {
                $lookup: {
                    from: "songs",
                    localField: "songId",
                    foreignField: "_id",
                    as: "song"
                }
            },
            { $unwind: "$song" },
            {
                $facet: {
                    "topSong": [
                        { $group: { _id: "$song", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 1 }
                    ],
                    "totalDuration": [
                        { $group: { _id: null, totalSeconds: { $sum: "$song.duration" } } }
                    ]
                }
            }
        ]);
        console.log("Stats:", JSON.stringify(stats, null, 2));
    }
    
    mongoose.disconnect();
};
run();
