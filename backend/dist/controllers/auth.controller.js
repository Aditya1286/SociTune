import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { recommender } from "../services/recommendation.service.js";
import { JWT_SECRET } from "../config/index.js";
// Hashing Helpers using native crypto
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
    const [salt, key] = storedHash.split(":");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return hash === key;
}
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
};
const setCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};
class AuthController {
    register = async (req, res, next) => {
        try {
            const { email, password, fullName, username } = req.body;
            if (!email || !password || !fullName) {
                return res.status(400).json({ message: "Email, password, and full name are required" });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User with this email already exists" });
            }
            const usernameToUse = username || `user_${Math.random().toString(36).substring(2, 8)}${Math.floor(Math.random() * 1000)}`;
            const hashedPassword = hashPassword(password);
            const userIdObj = new User()._id;
            const clerkId = userIdObj.toString();
            const newUser = await User.create({
                _id: userIdObj,
                clerkId,
                email,
                password: hashedPassword,
                fullName,
                displayName: fullName,
                username: usernameToUse.toLowerCase(),
                imageUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
                profileCompleted: false
            });
            await recommender.recalculateUser(clerkId);
            const token = generateToken(clerkId);
            setCookie(res, token);
            const userJson = newUser.toJSON();
            delete userJson.password;
            res.status(201).json({ success: true, user: userJson });
        }
        catch (error) {
            console.log("Error in register", error);
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            const user = await User.findOne({ email }).select("+password");
            if (!user || !user.password) {
                return res.status(400).json({ message: "Invalid email or password" });
            }
            const isMatch = verifyPassword(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid email or password" });
            }
            const token = generateToken(user.clerkId);
            setCookie(res, token);
            const userJson = user.toJSON();
            delete userJson.password;
            res.status(200).json({ success: true, user: userJson });
        }
        catch (error) {
            console.log("Error in login", error);
            next(error);
        }
    };
    googleLogin = async (req, res, next) => {
        try {
            const { credential } = req.body;
            if (!credential) {
                return res.status(400).json({ message: "Google credential is required" });
            }
            // Developer Mock Bypass
            if (typeof credential === "string" && credential.startsWith("mock_credential_")) {
                const profile = credential.replace("mock_credential_", "");
                const mockEmail = `${profile}@example.com`;
                const mockName = profile.charAt(0).toUpperCase() + profile.slice(1);
                let user = await User.findOne({ email: mockEmail });
                if (!user) {
                    const userIdObj = new User()._id;
                    const clerkId = userIdObj.toString();
                    user = await User.create({
                        _id: userIdObj,
                        clerkId,
                        email: mockEmail,
                        fullName: `${mockName} User`,
                        displayName: `${mockName} User`,
                        username: profile.toLowerCase(),
                        imageUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(mockName)}`,
                        profileCompleted: false
                    });
                    await recommender.recalculateUser(clerkId);
                }
                const token = generateToken(user.clerkId);
                setCookie(res, token);
                return res.status(200).json({ success: true, user });
            }
            // Verify Google ID token using Google Tokeninfo API
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
            if (!googleRes.ok) {
                return res.status(401).json({ message: "Invalid Google credential token" });
            }
            const payload = await googleRes.json();
            let user = await User.findOne({ email: payload.email });
            if (!user) {
                const userIdObj = new User()._id;
                const clerkId = userIdObj.toString();
                const fullName = `${payload.given_name || ""} ${payload.family_name || ""}`.trim() || "Google User";
                const username = (payload.given_name || "user").toLowerCase() + payload.sub.slice(-4);
                user = await User.create({
                    _id: userIdObj,
                    clerkId,
                    email: payload.email,
                    fullName,
                    displayName: fullName,
                    username,
                    imageUrl: payload.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
                    profileCompleted: false
                });
                await recommender.recalculateUser(clerkId);
            }
            const token = generateToken(user.clerkId);
            setCookie(res, token);
            res.status(200).json({ success: true, user });
        }
        catch (error) {
            console.log("Error in googleLogin", error);
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            res.clearCookie("token");
            res.status(200).json({ success: true, message: "Logged out successfully" });
        }
        catch (error) {
            console.log("Error in logout", error);
            next(error);
        }
    };
    // Clerk Google Sign-In sync and JWT session generation
    authCallback = async (req, res, next) => {
        try {
            const { id, firstName, lastName, email, imageUrl, username } = req.body;
            if (!id || !email) {
                return res.status(400).json({ message: "Clerk User ID and Email are required" });
            }
            let user = await User.findOne({ clerkId: id });
            if (!user) {
                // Check if user with same email exists (e.g. registered via email login earlier)
                user = await User.findOne({ email });
                if (user) {
                    // Update existing email user's clerkId to link with Google/Clerk OAuth
                    user.clerkId = id;
                    if (imageUrl && !user.imageUrl) {
                        user.imageUrl = imageUrl;
                    }
                    await user.save();
                }
                else {
                    // Create new user
                    const generatedUsername = username || `${(firstName || "user").toLowerCase()}${Math.floor(Math.random() * 1000)}`;
                    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Google User";
                    user = await User.create({
                        clerkId: id,
                        email,
                        fullName,
                        displayName: fullName,
                        username: generatedUsername.toLowerCase(),
                        imageUrl: imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
                        profileCompleted: false
                    });
                    await recommender.recalculateUser(id);
                }
            }
            const token = generateToken(user.clerkId);
            setCookie(res, token);
            res.status(200).json({ success: true, user });
        }
        catch (error) {
            console.log("Error in authCallback", error);
            next(error);
        }
    };
}
export default AuthController;
