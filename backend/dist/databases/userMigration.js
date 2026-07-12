import mongoose from "mongoose";
import { User } from "../models/user.model.js";
export const migrateExistingUsers = async () => {
    try {
        console.log("[User Migration] Checking for users that need migration...");
        const users = await User.find({});
        let migratedCount = 0;
        for (const user of users) {
            let updated = false;
            // 1. If uid doesn't exist, generate one
            if (!user.get("uid")) {
                user.set("uid", new mongoose.Types.ObjectId().toString());
                updated = true;
            }
            // 2. If displayName doesn't exist, set it to fullName
            if (!user.get("displayName")) {
                user.set("displayName", user.fullName || "");
                updated = true;
            }
            // 3. If profileCompleted is not defined:
            if (user.get("profileCompleted") === undefined) {
                // Determine if they completed onboarding:
                // - A custom bio/favoriteSong/favoriteArtist exist (non-empty)
                // - OR a username exists and does NOT match default random user format /^user_[a-z0-9]{6}\d{1,4}$/
                const hasCustomMusicTaste = user.bio || user.favoriteSong || user.favoriteArtist;
                const hasCustomUsername = user.username && !/^user_[a-z0-9]{6}\d{1,4}$/.test(user.username);
                if (hasCustomMusicTaste || hasCustomUsername) {
                    user.set("profileCompleted", true);
                }
                else {
                    user.set("profileCompleted", false);
                }
                updated = true;
            }
            if (updated) {
                await user.save();
                migratedCount++;
            }
        }
        console.log(`[User Migration] Completed. Migrated/updated ${migratedCount} user records.`);
    }
    catch (error) {
        console.error("[User Migration] Error migrating users:", error);
    }
};
