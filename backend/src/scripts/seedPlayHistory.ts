import mongoose from "mongoose";
import dotenv from "dotenv";
import { PlayHistory } from "../models/playHistory.model.js";
import { Song } from "../models/song.model.js";
import { User } from "../models/user.model.js";

dotenv.config();

const seedPlayHistory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing mock history
        await PlayHistory.deleteMany({});
        console.log("Cleared existing play history");

        const users = await User.find();
        const songs = await Song.find();

        if (users.length === 0 || songs.length === 0) {
            console.log("No users or songs found. Cannot seed play history.");
            process.exit(0);
        }

        const histories = [];
        const now = new Date();

        // Create random play histories for each user
        users.forEach(user => {
            // Generate 20-50 random plays for each user
            const numPlays = Math.floor(Math.random() * 30) + 20;

            for (let i = 0; i < numPlays; i++) {
                const randomSong = songs[Math.floor(Math.random() * songs.length)];
                
                // Random date between 60 days ago and now
                const daysAgo = Math.floor(Math.random() * 60);
                const playedAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

                histories.push({
                    userId: user.clerkId,
                    songId: randomSong._id,
                    playedAt
                });
            }
        });

        await PlayHistory.insertMany(histories);
        console.log(`Seeded ${histories.length} play history records`);

    } catch (error) {
        console.error("Error seeding play history:", error);
    } finally {
        mongoose.disconnect();
    }
};

seedPlayHistory();
