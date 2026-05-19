import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find();
    console.log("Users:", users.map(u => u.clerkId));
    mongoose.disconnect();
};
run();
