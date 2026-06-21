import mongoose from "mongoose";
import { MONGO_URI } from "../config/index.js";
export const connectWithMongo = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`Connected to MongoDB ${conn.connection.host}`);
    }
    catch (error) {
        console.log("Failed to connect to MongoDB", error);
        process.exit(1);
    }
};
