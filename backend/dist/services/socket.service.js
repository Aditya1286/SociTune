import { Server as SocketIOServer } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { NODE_ENV } from "../config/index.js";
import { socificationService } from "./socification.service.js";
export let io;
export const userSockets = new Map(); // { userId: socketId} store karega
export const userActivities = new Map(); // {userId: activity} store karega
export const sendRealtimeNotification = (userId, notification) => {
    if (io) {
        // Emit to user room user:{userId} and fallback directly to socketId
        io.to(`user:${userId}`).emit("new_notification", notification);
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit("new_notification", notification);
        }
    }
};
export const initializeSocket = (server) => {
    io = new SocketIOServer(server, {
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes backup for connection recovery
            skipMiddlewares: true,
        },
        cors: {
            origin: NODE_ENV === "production" ? true : ["http://localhost:3000", "http://localhost:3001"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        // If auth contains userId on initial handshake, auto-join room
        const userId = socket.handshake.auth?.userId || socket.auth?.userId;
        if (userId) {
            socket.join(`user:${userId}`);
            userSockets.set(userId, socket.id);
        }
        socket.on("user_connected", (userId) => {
            socket.join(`user:${userId}`);
            userSockets.set(userId, socket.id);
            userActivities.set(userId, "Idle");
            // broadcast to all connected sockets that this user just logged in
            io.emit("user_connected", userId);
            socket.emit("users_online", Array.from(userSockets.keys()));
            io.emit("activities", Array.from(userActivities.entries()));
        });
        socket.on("update_activity", async ({ userId, activity }) => {
            console.log("activity updated", userId, activity);
            userActivities.set(userId, activity);
            // Only emit to friends
            const user = await User.findOne({ clerkId: userId });
            if (user && user.friends) {
                user.friends.forEach((friendId) => {
                    const friendSocketId = userSockets.get(friendId);
                    if (friendSocketId) {
                        io.to(friendSocketId).emit("activity_updated", { userId, activity });
                    }
                });
            }
        });
        socket.on("send_message", async (data) => {
            try {
                const { senderId, receiverId, content, replyToId, imageUrl, voiceNoteUrl } = data;
                // Check if they are friends
                const senderUser = await User.findOne({ clerkId: senderId });
                if (!senderUser || !senderUser.friends.includes(receiverId)) {
                    return socket.emit("message_error", "You must be friends to send a message.");
                }
                let messageData = {
                    senderId,
                    receiverId,
                    content: content || "",
                };
                if (imageUrl)
                    messageData.imageUrl = imageUrl;
                if (voiceNoteUrl)
                    messageData.voiceNoteUrl = voiceNoteUrl;
                if (replyToId) {
                    messageData.replyTo = replyToId;
                }
                let message = await Message.create(messageData);
                if (replyToId) {
                    message = await message.populate("replyTo", "content senderId");
                }
                // Create/update an unread messages notification for the receiver via HTTP/Service
                const senderName = senderUser.fullName;
                const senderAvatar = senderUser.imageUrl;
                const notificationMsg = content || (imageUrl ? "Sent an image" : voiceNoteUrl ? "Sent a voice note" : "New message");
                socificationService.createMessageNotification({
                    senderId,
                    receiverId,
                    senderName,
                    senderAvatar,
                    message: notificationMsg
                }).catch(console.error);
                // send to receiver in realtime, if they're online
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
                socket.emit("message_sent", message);
            }
            catch (error) {
                console.error("Message error:", error);
                socket.emit("message_error", error.message);
            }
        });
        socket.on("mark_messages_read", async ({ senderId, receiverId }) => {
            try {
                await Message.updateMany({ senderId, receiverId, isRead: false }, { $set: { isRead: true } });
                // Notify the original sender that their messages have been read
                const originalSenderSocketId = userSockets.get(senderId);
                if (originalSenderSocketId) {
                    io.to(originalSenderSocketId).emit("messages_marked_read", { receiverId });
                }
                // Mark message notifications from this sender to this receiver as read via Service
                socificationService.markMessagesAsRead({ senderId, receiverId }).catch(console.error);
            }
            catch (error) {
                console.error("Error marking messages as read:", error);
            }
        });
        socket.on("delete_message", async ({ messageId, senderId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message || message.senderId !== senderId)
                    return;
                await Message.findByIdAndDelete(messageId);
                io.emit("message_deleted", messageId);
            }
            catch (error) {
                console.error("Error deleting message:", error);
            }
        });
        socket.on("react_message", async ({ messageId, senderId, emoji }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message)
                    return;
                // Toggle reaction
                const currentReactions = message.reactions || {};
                if (currentReactions[senderId] === emoji) {
                    delete currentReactions[senderId];
                }
                else {
                    currentReactions[senderId] = emoji;
                }
                // Mark modified for mongoose Map/Object
                message.reactions = currentReactions;
                message.markModified('reactions');
                await message.save();
                io.emit("message_reacted", { messageId, reactions: currentReactions });
            }
            catch (error) {
                console.error("Error reacting to message:", error);
            }
        });
        socket.on("disconnect", async () => {
            let disconnectedUserId;
            let lastAct = "Offline";
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    lastAct = userActivities.get(userId);
                    userSockets.delete(userId);
                    userActivities.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                const now = new Date();
                let finalActivity = "Offline";
                if (lastAct && lastAct !== "Idle" && lastAct !== "Offline") {
                    const cleanedAct = lastAct.replace("Paused: ", "").replace("Playing ", "").replace("Paused ", "");
                    finalActivity = cleanedAct.startsWith("Listening to ")
                        ? cleanedAct.replace("Listening to ", "Recently listened: ")
                        : `Recently listened: ${cleanedAct}`;
                }
                try {
                    await User.findOneAndUpdate({ clerkId: disconnectedUserId }, { lastSeen: now, lastActivity: finalActivity });
                }
                catch (err) {
                    console.error("Error updating lastSeen", err);
                }
                io.emit("user_disconnected", { userId: disconnectedUserId, lastSeen: now.toISOString(), lastActivity: finalActivity });
            }
        });
    });
};
