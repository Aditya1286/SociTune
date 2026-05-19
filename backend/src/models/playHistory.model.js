import mongoose from "mongoose";

const playHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Clerk user ID
    songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
    playedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const PlayHistory = mongoose.model("PlayHistory", playHistorySchema);
