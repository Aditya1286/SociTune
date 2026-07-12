//Redundant -> Remove everything related to this schema
import mongoose from "mongoose";
const playHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Clerk user ID
    songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
    playedAt: { type: Date, default: Date.now },
    duration_ms: { type: String },
    completed: { type: Boolean },
    session_id: { type: String },
    source: { type: String }
}, { timestamps: true });
playHistorySchema.index({ userId: 1, playedAt: -1 });
playHistorySchema.index({ songId: 1 });
export const PlayHistory = mongoose.model("PlayHistory", playHistorySchema);
