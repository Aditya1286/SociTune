//Redundant -> Remove everything related to this schema
import mongoose from "mongoose";

const playHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Clerk user ID
    songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
    playedAt: { type: Date, default: Date.now },
    durationMs: { type: String },
    completed: { type: Boolean },
    sessionId: { type: String },
    source: { type: String }
}, { timestamps: true });

playHistorySchema.index({ userId: 1, playedAt: -1 });
playHistorySchema.index({ songId: 1 });

export const PlayHistory = mongoose.model("PlayHistory", playHistorySchema);
