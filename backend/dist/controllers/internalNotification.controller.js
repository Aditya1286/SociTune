import { Notification } from "../models/notification.model.js";
import { io } from "../services/socket.service.js";
class InternalNotificationController {
    // POST /internal/notifications/create
    async createNotification(req, res, next) {
        try {
            const { userId, senderId, senderName, senderAvatar, type, title, message, metadata, entityId, actor } = req.body;
            if (!userId || !type) {
                return res.status(400).json({ message: "userId and type are required" });
            }
            let notif;
            if (type === "PLAYLIST_LIKE") {
                if (!actor || !actor.userId || !actor.name) {
                    return res.status(400).json({ message: "actor (userId, name) is required for PLAYLIST_LIKE type" });
                }
                // Check for existing unread playlist like notification for this user and entity
                const existingNotif = await Notification.findOne({
                    userId,
                    type: "PLAYLIST_LIKE",
                    entityId,
                    isRead: false
                });
                if (existingNotif) {
                    // Check if actor is already added
                    const actorExists = existingNotif.actors.some((a) => a.userId === actor.userId);
                    if (!actorExists) {
                        existingNotif.actors.push(actor);
                    }
                    const count = existingNotif.actors.length;
                    existingNotif.message = count > 1
                        ? `${count} people liked your playlist`
                        : `${actor.name} liked your playlist`;
                    existingNotif.createdAt = new Date();
                    notif = await existingNotif.save();
                }
                else {
                    notif = await Notification.create({
                        userId,
                        type: "PLAYLIST_LIKE",
                        entityId,
                        actors: [actor],
                        title: "Playlist Liked",
                        message: `${actor.name} liked your playlist`,
                        isRead: false
                    });
                }
            }
            else {
                // Standard notification
                notif = await Notification.create({
                    userId,
                    senderId,
                    senderName,
                    senderAvatar,
                    type,
                    title,
                    message,
                    metadata,
                    isRead: false
                });
            }
            // Fetch current unread count
            const unreadCount = await Notification.countDocuments({ userId, isRead: false });
            // Emit to the user's Socket room: user:{userId}
            if (io) {
                io.to(`user:${userId}`).emit("notification:new", {
                    notification: notif,
                    unreadCount
                });
            }
            res.status(201).json({ success: true, notification: notif, unreadCount });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /internal/notifications/message
    async createMessageNotification(req, res, next) {
        try {
            const { senderId, receiverId, senderName, senderAvatar, message } = req.body;
            if (!senderId || !receiverId) {
                return res.status(400).json({ message: "senderId and receiverId are required" });
            }
            // Check for existing unread messages notification from this sender
            let notif = await Notification.findOne({
                userId: receiverId,
                senderId,
                type: "messages",
                isRead: false
            });
            if (notif) {
                notif.message = message;
                notif.title = `New message from ${senderName}`;
                notif.createdAt = new Date();
                await notif.save();
            }
            else {
                notif = await Notification.create({
                    userId: receiverId,
                    senderId,
                    senderName,
                    senderAvatar,
                    type: "messages",
                    title: `New message from ${senderName}`,
                    message: message,
                    isRead: false
                });
            }
            // Fetch unread count for receiver
            const unreadCount = await Notification.countDocuments({ userId: receiverId, isRead: false });
            // Emit to receiver's socket room
            if (io) {
                io.to(`user:${receiverId}`).emit("notification:new", {
                    notification: notif,
                    unreadCount
                });
            }
            res.status(200).json({ success: true, notification: notif, unreadCount });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /internal/notifications/read-messages
    async readMessagesNotification(req, res, next) {
        try {
            const { senderId, receiverId } = req.body;
            if (!senderId || !receiverId) {
                return res.status(400).json({ message: "senderId and receiverId are required" });
            }
            // Find notifications to update so we can emit events for them
            const notificationsToUpdate = await Notification.find({ userId: receiverId, senderId, type: "messages", isRead: false });
            // Mark message notifications from sender to receiver as read
            await Notification.updateMany({ userId: receiverId, senderId, type: "messages", isRead: false }, { $set: { isRead: true } });
            // Fetch updated unread count for receiver
            const unreadCount = await Notification.countDocuments({ userId: receiverId, isRead: false });
            // Emit update event to receiver's socket room
            if (io) {
                notificationsToUpdate.forEach(n => {
                    io.to(`user:${receiverId}`).emit("notification:read", { notificationId: n._id.toString(), unreadCount });
                });
                io.to(`user:${receiverId}`).emit("notification:count-updated", { unreadCount });
            }
            res.status(200).json({ success: true, unreadCount });
        }
        catch (error) {
            next(error);
        }
    }
}
export default InternalNotificationController;
