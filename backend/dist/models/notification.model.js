import mongoose from "mongoose";
import { FEATURE_SOCIFICATION } from "../config/index.js";
import { socificationConnection } from "../databases/socification.db.js";
const notificationSchema = new mongoose.Schema({
    userId: {
        type: String, // clerkId of the recipient
        required: true,
        index: true
    },
    senderId: {
        type: String, // clerkId of the sender (optional, e.g., for friend requests)
        required: false
    },
    senderName: {
        type: String,
        required: false
    },
    senderAvatar: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: ["social", "messages", "music", "ai", "system", "PLAYLIST_LIKE"],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    // For aggregated notifications
    actors: [
        {
            userId: { type: String },
            name: { type: String },
            avatar: { type: String }
        }
    ],
    entityId: {
        type: String,
        required: false
    },
    // Meta properties for specific notification categories
    metadata: {
        // Compatibility card meta
        matchPercentage: { type: Number },
        sharedArtists: [{ type: String }],
        matchUserId: { type: String },
        // Trending playlist card meta
        playlistCoverUrl: { type: String },
        genreBadge: { type: String }, // DHH, Pop, Indie, Lo-Fi, etc.
        playlistId: { type: String },
        // Listening Activity card meta
        songId: { type: String },
        songTitle: { type: String },
        songArtist: { type: String },
        songArtwork: { type: String },
        artistImage: { type: String },
        listeningStatus: { type: String }, // "playing", "paused", "listened"
        // AI report card meta
        musicPersonality: { type: String }, // e.g. "Melodic Dreamer", "Hip Hop Head"
        moodTrend: [{ type: String }], // e.g. ["Chill", "Energetic", "Happy"]
        recommendations: [{ type: String }] // recommended tracks
    }
}, { timestamps: true });
// Define explicit indexes as requested
notificationSchema.index({ createdAt: -1 });
// Export the model based on feature flag
export const Notification = FEATURE_SOCIFICATION
    ? socificationConnection.model("Notification", notificationSchema)
    : mongoose.model("Notification", notificationSchema);
