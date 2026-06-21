import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true }, //Clerk user ID
    receiverId: { type: String, required: true },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    voiceNoteUrl: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    reactions: { type: Object, default: {} },
}, { timestamps: true });
export const Message = mongoose.model("Message", messageSchema);
