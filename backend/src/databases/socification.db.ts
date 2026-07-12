import mongoose from "mongoose";
import { MONGO_URI } from "../config/index.js";

// Helper to derive the socification_db connection URI
const getSocificationUri = (uri: string): string => {
    if (!uri) return uri;
    // Replace the database name in the connection string
    if (uri.includes("/SociTune")) {
        return uri.replace("/SociTune", "/socification_db");
    }
    // If it's a local/other URI, try to replace/append
    try {
        const url = new URL(uri);
        url.pathname = "/socification_db";
        return url.toString();
    } catch (e) {
        return uri;
    }
};

export const socificationDbUri = getSocificationUri(MONGO_URI);
console.log(`[Socification DB] Target URI: ${socificationDbUri}`);

// Create a dedicated connection pool
export const socificationConnection = mongoose.createConnection(socificationDbUri);

socificationConnection.on("connected", () => {
    console.log(`[Socification DB] Connected to database: socification_db`);
});

socificationConnection.on("error", (err) => {
    console.error(`[Socification DB] Connection error:`, err);
});

// Migration helper to move notifications from legacy SociTune database to socification_db
export const migrateExistingNotifications = async () => {
    try {
        // Wait for both connections to be ready
        await new Promise<void>((resolve) => {
            if (socificationConnection.readyState === 1) {
                resolve();
            } else {
                socificationConnection.once("open", () => resolve());
            }
        });

        const oldDb = mongoose.connection.db;
        if (!oldDb) return;

        // Check if old notifications collection exists
        const collections = await oldDb.listCollections({ name: "notifications" }).toArray();
        if (collections.length === 0) return;

        const oldCollection = oldDb.collection("notifications");
        const count = await oldCollection.countDocuments();
        if (count === 0) return;

        console.log(`[Migration] Found ${count} legacy notifications to migrate to socification_db...`);

        // Fetch all legacy notifications
        const legacyNotifications = await oldCollection.find({}).toArray();

        // Get the new notifications collection
        const newCollection = socificationConnection.collection("notifications");

        // Insert documents preserving their IDs to prevent duplicate insertion
        let migratedCount = 0;
        for (const doc of legacyNotifications) {
            const exists = await newCollection.findOne({ _id: doc._id });
            if (!exists) {
                await newCollection.insertOne(doc);
                migratedCount++;
            }
        }

        console.log(`[Migration] Successfully migrated ${migratedCount}/${count} notifications.`);

        // Rename legacy collection to back it up/avoid checking on subsequent runs
        try {
            await oldCollection.rename("notifications_migrated");
            console.log("[Migration] Renamed legacy notifications collection to notifications_migrated");
        } catch (renameError) {
            // If rename fails (e.g. target exists), drop the collection as we have successfully copied it
            await oldCollection.drop();
            console.log("[Migration] Dropped legacy notifications collection after successful copy");
        }
    } catch (error) {
        console.error("[Migration] Error during notification migration:", error);
    }
};
