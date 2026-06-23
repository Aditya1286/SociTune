import { FEATURE_SOCIFICATION, INTERNAL_SERVICE_TOKEN, SOCIFICATION_SERVICE_URL } from "../config/index.js";
import { Notification } from "../models/notification.model.js";
import { io } from "./socket.service.js";

class SocificationService {
    private getBaseUrl() {
        return SOCIFICATION_SERVICE_URL;
    }

    private getHeaders() {
        return {
            "Content-Type": "application/json",
            "X-Service-Token": INTERNAL_SERVICE_TOKEN
        };
    }

    public async createNotification(data: {
        userId: string;
        senderId?: string;
        senderName?: string;
        senderAvatar?: string;
        type: string;
        title: string;
        message: string;
        metadata?: any;
        entityId?: string;
        actor?: { userId: string; name: string; avatar: string };
    }) {
        if (FEATURE_SOCIFICATION) {
            try {
                const response = await fetch(`${this.getBaseUrl()}/internal/notifications/create`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                }
                return await response.json();
            } catch (error) {
                console.error("[SocificationService] Error calling createNotification endpoint:", error);
                return this.fallbackCreateNotification(data);
            }
        } else {
            return this.fallbackCreateNotification(data);
        }
    }

    public async createMessageNotification(data: {
        senderId: string;
        receiverId: string;
        senderName: string;
        senderAvatar: string;
        message: string;
    }) {
        if (FEATURE_SOCIFICATION) {
            try {
                const response = await fetch(`${this.getBaseUrl()}/internal/notifications/message`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                }
                return await response.json();
            } catch (error) {
                console.error("[SocificationService] Error calling createMessageNotification endpoint:", error);
                return this.fallbackCreateMessageNotification(data);
            }
        } else {
            return this.fallbackCreateMessageNotification(data);
        }
    }

    public async markMessagesAsRead(data: {
        senderId: string;
        receiverId: string;
    }) {
        if (FEATURE_SOCIFICATION) {
            try {
                const response = await fetch(`${this.getBaseUrl()}/internal/notifications/read-messages`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                }
                return await response.json();
            } catch (error) {
                console.error("[SocificationService] Error calling markMessagesAsRead endpoint:", error);
                return this.fallbackMarkMessagesAsRead(data);
            }
        } else {
            return this.fallbackMarkMessagesAsRead(data);
        }
    }

    public async markAllRead(userId: string) {
        if (FEATURE_SOCIFICATION) {
            try {
                const response = await fetch(`${this.getBaseUrl()}/internal/notifications/read-all`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({ userId })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                }
                return await response.json();
            } catch (error) {
                console.error("[SocificationService] Error calling markAllRead endpoint:", error);
                return this.fallbackMarkAllRead(userId);
            }
        } else {
            return this.fallbackMarkAllRead(userId);
        }
    }

    public async markRead(userId: string, id: string) {
        if (FEATURE_SOCIFICATION) {
            try {
                const response = await fetch(`${this.getBaseUrl()}/internal/notifications/mark-read`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({ userId, id })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                }
                return await response.json();
            } catch (error) {
                console.error("[SocificationService] Error calling markRead endpoint:", error);
                return this.fallbackMarkRead(userId, id);
            }
        } else {
            return this.fallbackMarkRead(userId, id);
        }
    }

    public async deleteNotification(userId: string, id: string) {
        if (FEATURE_SOCIFICATION) {
            try {
                const response = await fetch(`${this.getBaseUrl()}/internal/notifications/delete`, {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({ userId, id })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                }
                return await response.json();
            } catch (error) {
                console.error("[SocificationService] Error calling deleteNotification endpoint:", error);
                return this.fallbackDeleteNotification(userId, id);
            }
        } else {
            return this.fallbackDeleteNotification(userId, id);
        }
    }

    // --- FALLBACK DIRECT DB & SOCKET EMIT WRITERS ---
    private async fallbackCreateNotification(data: any) {
        console.log("[SocificationService] Running fallback direct database write for notification");
        const notif = await Notification.create({
            userId: data.userId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: data.metadata,
            entityId: data.entityId,
            actors: data.actor ? [data.actor] : [],
            isRead: false
        });

        const unreadCount = await Notification.countDocuments({ userId: data.userId, isRead: false });

        if (io) {
            io.to(`user:${data.userId}`).emit("notification:new", { notification: notif, unreadCount });
            
            // support legacy client
            const socketId = (await import("./socket.service.js")).userSockets.get(data.userId);
            if (socketId) {
                io.to(socketId).emit("new_notification", notif);
            }
        }
        return { success: true, notification: notif, unreadCount };
    }

    private async fallbackCreateMessageNotification(data: any) {
        console.log("[SocificationService] Running fallback direct database write for message notification");
        let notif = await Notification.findOne({
            userId: data.receiverId,
            senderId: data.senderId,
            type: "messages",
            isRead: false
        });

        if (notif) {
            notif.message = data.message;
            notif.title = `New message from ${data.senderName}`;
            notif.createdAt = new Date();
            await notif.save();
        } else {
            notif = await Notification.create({
                userId: data.receiverId,
                senderId: data.senderId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar,
                type: "messages",
                title: `New message from ${data.senderName}`,
                message: data.message,
                isRead: false
            });
        }

        const unreadCount = await Notification.countDocuments({ userId: data.receiverId, isRead: false });

        if (io) {
            io.to(`user:${data.receiverId}`).emit("notification:new", { notification: notif, unreadCount });
            
            // support legacy client
            const socketId = (await import("./socket.service.js")).userSockets.get(data.receiverId);
            if (socketId) {
                io.to(socketId).emit("new_notification", notif);
            }
        }
        return { success: true, notification: notif, unreadCount };
    }

    private async fallbackMarkMessagesAsRead(data: any) {
        console.log("[SocificationService] Running fallback direct database update for reading messages");
        await Notification.updateMany(
            { userId: data.receiverId, senderId: data.senderId, type: "messages", isRead: false },
            { $set: { isRead: true } }
        );

        const unreadCount = await Notification.countDocuments({ userId: data.receiverId, isRead: false });
        if (io) {
            io.to(`user:${data.receiverId}`).emit("notification:count-updated", { unreadCount });
        }
        return { success: true, unreadCount };
    }

    private async fallbackMarkAllRead(userId: string) {
        await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
        if (io) {
            io.to(`user:${userId}`).emit("notification:count-updated", { unreadCount: 0 });
        }
        return { success: true };
    }

    private async fallbackMarkRead(userId: string, id: string) {
        await Notification.findOneAndUpdate({ _id: id, userId }, { $set: { isRead: true } });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });
        if (io) {
            io.to(`user:${userId}`).emit("notification:read", { notificationId: id, unreadCount });
        }
        return { success: true };
    }

    private async fallbackDeleteNotification(userId: string, id: string) {
        await Notification.findOneAndDelete({ _id: id, userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });
        if (io) {
            io.to(`user:${userId}`).emit("notification:deleted", { notificationId: id, unreadCount });
        }
        return { success: true };
    }
}

export const socificationService = new SocificationService();
