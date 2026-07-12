import { Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { recommender } from "../services/recommendation.service.js";
import { JWT_SECRET } from "../config/index.js";
import mongoose from "mongoose";

class AuthController {
    public async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, fullName, username } = req.body;

            if (!email || !password || !fullName) {
                return res.status(400).json({ message: "Email, password, and full name are required." });
            }

            const existingEmail = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
            if (existingEmail) {
                return res.status(400).json({ message: "Email is already registered." });
            }

            const generatedUsername = username || `user_${Math.random().toString(36).substring(2, 8)}${Math.floor(Math.random() * 1000)}`;
            const existingUsername = await User.findOne({ username: new RegExp(`^${generatedUsername}$`, "i") });
            if (existingUsername) {
                return res.status(400).json({ message: "Username handle is already taken." });
            }

            const hashedPassword = await bcryptjs.hash(password, 10);
            
            // Generate a unique identifier that acts as the "clerkId" so we don't break existing codebase
            const customUserId = new mongoose.Types.ObjectId().toString();

            const user = await User.create({
                clerkId: customUserId,
                email: email.toLowerCase(),
                password: hashedPassword,
                fullName,
                displayName: fullName,
                username: generatedUsername,
                imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
                profileCompleted: false
            });

            // Immediately register the user in the recommendation cache
            await recommender.recalculateUser(customUserId);

            // Sign token with 30 minutes expiration
            const token = jwt.sign({ userId: customUserId }, JWT_SECRET, { expiresIn: "30m" });

            res.status(201).json({
                token,
                user: {
                    clerkId: user.clerkId,
                    email: user.email,
                    fullName: user.fullName,
                    displayName: user.displayName,
                    username: user.username,
                    imageUrl: user.imageUrl,
                    profileCompleted: user.profileCompleted
                }
            });
        } catch (error) {
            console.error("Signup error:", error);
            next(error);
        }
    }

    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required." });
            }

            const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") }).select("+password");
            if (!user || !user.password) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            const isPasswordValid = await bcryptjs.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid email or password." });
            }

            // Sign token
            const token = jwt.sign({ userId: user.clerkId }, JWT_SECRET, { expiresIn: "30m" });

            res.status(200).json({
                token,
                user: {
                    clerkId: user.clerkId,
                    email: user.email,
                    fullName: user.fullName,
                    displayName: user.displayName,
                    username: user.username,
                    imageUrl: user.imageUrl,
                    profileCompleted: user.profileCompleted
                }
            });
        } catch (error) {
            console.error("Login error:", error);
            next(error);
        }
    }

    public async authCallback(req: Request, res: Response, next: NextFunction) {
        // Kept for backward compatibility with Clerk callbacks if any
        try {
            const { id, firstName, lastName, imageUrl, username } = req.body;
            const generatedUsername = username || `user_${Math.random().toString(36).substring(2, 8)}${Math.floor(Math.random() * 1000)}`;

            const user = await User.findOne({ clerkId: id });
            if (!user) {
                await User.create({
                    clerkId: id,
                    fullName: `${firstName} ${lastName}`,
                    displayName: `${firstName} ${lastName}`,
                    username: generatedUsername,
                    imageUrl: imageUrl,
                    profileCompleted: false
                });
                
                await recommender.recalculateUser(id);
            }
            res.status(200).json({ sucess: true });
        } catch (error) {
            console.log("Error in authentication", error);
            next(error);
        }
    }
}

export default AuthController;