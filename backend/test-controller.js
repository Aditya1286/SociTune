import mongoose from "mongoose";
import dotenv from "dotenv";
import { getTimeTravelStats } from "./src/controller/user.controller.js";
import { PlayHistory } from "./src/models/playHistory.model.js";

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const doc = await PlayHistory.findOne();
    
    if (doc) {
        const req = { auth: { userId: doc.userId } };
        const res = {
            status: (code) => {
                console.log("Status:", code);
                return {
                    json: (data) => console.log("Response:", JSON.stringify(data, null, 2))
                }
            }
        };
        const next = (err) => console.log("Next Error:", err);
        
        await getTimeTravelStats(req, res, next);
    } else {
        console.log("No play history found");
    }
    
    mongoose.disconnect();
};
run();
