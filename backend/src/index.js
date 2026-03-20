import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from '@clerk/express';
import fileUpload from "express-fileupload";
import path from "path";

import userRoutes from "./routes/user.route.js"
import authRoutes from "./routes/auth.route.js"
import songRoutes from "./routes/song.route.js"
import albumRoutes from "./routes/album.route.js"
import statRoutes from "./routes/stat.route.js"
import adminRoutes from "./routes/admin.route.js"
import { connectDB } from "./lib/db.js";
dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(clerkMiddleware());//auth to req object
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir:path.join(__dirname,"tmp"),
    createParentPath:true,
    limits:{
        fileSize: 10*10*1024
    },
})
);

app.use('/api/users',userRoutes);
app.use('/api/admin',adminRoutes);
app.use("/api/auth",authRoutes);
app.use('/api/songs',songRoutes);
app.use('/api/albums',albumRoutes);
app.use('/api/stats',statRoutes);  
app.listen(PORT,()=>{
    console.log("Server is runnnig at port "+PORT);
    connectDB();
})