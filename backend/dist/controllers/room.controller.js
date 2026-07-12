import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { socificationService } from "../services/socification.service.js";
import { io, userSockets } from "../services/socket.service.js";
class RoomController {
    async createRoom(req, res, next) {
        try {
            const hostId = req.auth.userId;
            const { name, description, coverUrl, moodTags, visibility, invitedUsers, scheduledStartTime, reminderLeadTime, isLiveNow, } = req.body;
            const host = await User.findOne({ clerkId: hostId });
            if (!host) {
                return res.status(404).json({ message: "Host user not found" });
            }
            const room = await Room.create({
                name,
                description,
                hostId,
                coverUrl: coverUrl || "/albums/default.jpg",
                moodTags: moodTags || [],
                visibility: visibility || "public",
                invitedUsers: invitedUsers || [],
                scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
                reminderLeadTime: reminderLeadTime || 15,
                isLive: !!isLiveNow,
                listeners: [hostId],
            });
            // Send invitations in real time to invited users if visibility is private
            if (visibility === "private" && invitedUsers && invitedUsers.length > 0) {
                for (const inviteeId of invitedUsers) {
                    const notificationData = {
                        userId: inviteeId,
                        senderId: hostId,
                        senderName: host.fullName,
                        senderAvatar: host.imageUrl,
                        type: "social",
                        title: "Room Invitation Received",
                        message: `${host.fullName} invited you to a room: "${name}"`,
                        entityId: room._id.toString(),
                        metadata: {
                            playlistCoverUrl: room.coverUrl,
                        },
                    };
                    // Save notification
                    await socificationService.createNotification(notificationData);
                    // Emit direct invite via sockets
                    const inviteeSocketId = userSockets.get(inviteeId);
                    if (inviteeSocketId && io) {
                        io.to(inviteeSocketId).emit("room_invitation", {
                            roomId: room._id.toString(),
                            roomName: name,
                            hostName: host.fullName,
                            hostAvatar: host.imageUrl,
                            coverUrl: room.coverUrl,
                            scheduledStartTime: room.scheduledStartTime,
                        });
                    }
                }
            }
            // Broadcast new room availability to all online users
            if (io) {
                io.emit("room_created", room);
            }
            res.status(201).json(room);
        }
        catch (error) {
            console.error("Error in createRoom:", error);
            next(error);
        }
    }
    async getRooms(req, res, next) {
        try {
            const rooms = await Room.find({}).sort({ createdAt: -1 });
            res.status(200).json(rooms);
        }
        catch (error) {
            console.error("Error in getRooms:", error);
            next(error);
        }
    }
    async getRoomById(req, res, next) {
        try {
            const { roomId } = req.params;
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            res.status(200).json(room);
        }
        catch (error) {
            console.error("Error in getRoomById:", error);
            next(error);
        }
    }
    async joinRoom(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { roomId } = req.params;
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            // Update room listeners
            if (!room.listeners.includes(userId)) {
                room.listeners.push(userId);
                if (!room.isLive && room.hostId === userId) {
                    room.isLive = true;
                }
                await room.save();
            }
            // Fetch user details for real-time join feed
            const user = await User.findOne({ clerkId: userId }).select("fullName imageUrl clerkId username");
            // Broadcast join event
            if (io) {
                io.to(`room:${roomId}`).emit("user_joined_room", {
                    roomId,
                    userId,
                    user,
                });
            }
            res.status(200).json(room);
        }
        catch (error) {
            console.error("Error in joinRoom:", error);
            next(error);
        }
    }
    async leaveRoom(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { roomId } = req.params;
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            room.listeners = room.listeners.filter((id) => id !== userId);
            await room.save();
            // Broadcast leave event
            if (io) {
                io.to(`room:${roomId}`).emit("user_left_room", {
                    roomId,
                    userId,
                });
            }
            res.status(200).json(room);
        }
        catch (error) {
            console.error("Error in leaveRoom:", error);
            next(error);
        }
    }
    async cancelRoom(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { roomId } = req.params;
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            if (room.hostId !== userId) {
                return res.status(403).json({ message: "Only the host can cancel the room" });
            }
            const invited = room.invitedUsers || [];
            const cover = room.coverUrl;
            const name = room.name;
            // Delete room or flag cancelled
            await Room.findByIdAndDelete(roomId);
            // Notify invited users of cancellation
            for (const inviteeId of invited) {
                const notificationData = {
                    userId: inviteeId,
                    type: "social",
                    title: "Room Cancelled",
                    message: `The room "${name}" has been cancelled.`,
                    entityId: roomId,
                    metadata: {
                        playlistCoverUrl: cover,
                    },
                };
                await socificationService.createNotification(notificationData);
                const inviteeSocketId = userSockets.get(inviteeId);
                if (inviteeSocketId && io) {
                    io.to(inviteeSocketId).emit("room_cancelled", { roomId });
                }
            }
            if (io) {
                io.to(`room:${roomId}`).emit("room_cancelled_broadcast", { roomId });
            }
            res.status(200).json({ success: true, message: "Room cancelled and deleted" });
        }
        catch (error) {
            console.error("Error in cancelRoom:", error);
            next(error);
        }
    }
    async transferDJ(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { roomId } = req.params;
            const { newHostId } = req.body;
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            if (room.hostId !== userId) {
                return res.status(403).json({ message: "Only the host can transfer DJ privileges" });
            }
            const oldHost = await User.findOne({ clerkId: userId }).select("fullName");
            const newHost = await User.findOne({ clerkId: newHostId }).select("fullName");
            if (!newHost) {
                return res.status(404).json({ message: "New host user not found" });
            }
            room.hostId = newHostId;
            await room.save();
            if (io) {
                io.to(`room:${roomId}`).emit("room_dj_transferred", {
                    roomId,
                    oldHostId: userId,
                    oldHostName: oldHost?.fullName || "Previous Host",
                    newHostId,
                    newHostName: newHost.fullName,
                });
            }
            res.status(200).json(room);
        }
        catch (error) {
            console.error("Error in transferDJ:", error);
            next(error);
        }
    }
    async updatePlayback(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { roomId } = req.params;
            const { currentSong, queue, requests } = req.body;
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            const isAuthorized = room.hostId === userId || room.coDjs.includes(userId);
            if (!isAuthorized) {
                // Regular user can only submit/update requests, they cannot touch currentSong or queue
                if (currentSong !== undefined || queue !== undefined) {
                    return res.status(403).json({ message: "Only the DJ or co-DJs can update playback and lineup" });
                }
            }
            if (currentSong !== undefined)
                room.currentSong = currentSong;
            if (queue !== undefined)
                room.queue = queue;
            if (requests !== undefined)
                room.requests = requests;
            await room.save();
            if (io) {
                io.to(`room:${roomId}`).emit("room_playback_updated", {
                    roomId,
                    currentSong: room.currentSong,
                    queue: room.queue,
                    requests: room.requests,
                });
            }
            res.status(200).json(room);
        }
        catch (error) {
            console.error("Error in updatePlayback:", error);
            next(error);
        }
    }
}
export default RoomController;
