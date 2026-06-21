import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { PlayHistory } from "../models/playHistory.model.js";
import cloudinary from "../services/cloudinary.service.js";
import { recommender } from "../services/recommendation.service.js";
import { io, userSockets } from "../services/socket.service.js";
class UserController {
    async getAllUsers(req, res, next) {
        try {
            const currentUserId = req.auth.userId;
            const currentUser = await User.findOne({ clerkId: currentUserId });
            const users = await User.find({ clerkId: { $ne: currentUserId } });
            const usersWithDetails = await Promise.all(users.map(async (user) => {
                const isFriend = currentUser.friends.includes(user.clerkId);
                const isPending = currentUser.pendingRequests.includes(user.clerkId);
                const isSent = currentUser.sentRequests.includes(user.clerkId);
                // Calculate mutual friends
                const mutualFriends = user.friends.filter(f => currentUser.friends.includes(f));
                const mutualFriendsCount = mutualFriends.length;
                let lastMessageContent = null;
                let unreadCount = 0;
                if (isFriend) {
                    const lastMessage = await Message.findOne({
                        $or: [
                            { senderId: user.clerkId, receiverId: currentUserId },
                            { senderId: currentUserId, receiverId: user.clerkId },
                        ],
                    }).sort({ createdAt: -1 });
                    lastMessageContent = lastMessage ? lastMessage.content : null;
                    unreadCount = await Message.countDocuments({
                        senderId: user.clerkId,
                        receiverId: currentUserId,
                        isRead: false
                    });
                }
                return {
                    ...user.toJSON(),
                    lastMessage: lastMessageContent,
                    unreadCount,
                    isFriend,
                    isPending,
                    isSent,
                    mutualFriendsCount,
                    lastActivity: isFriend ? user.lastActivity : undefined,
                };
            }));
            res.status(200).json(usersWithDetails);
        }
        catch (error) {
            next(error);
        }
    }
    async getMessages(req, res, next) {
        try {
            const myId = req.auth.userId;
            const { userId } = req.params;
            // Optional: check if they are friends before allowing message fetch
            const currentUser = await User.findOne({ clerkId: myId });
            if (!currentUser.friends.includes(userId)) {
                return res.status(403).json({ message: "You must be friends to view messages." });
            }
            const messages = await Message.find({
                $or: [
                    { senderId: userId, receiverId: myId },
                    { senderId: myId, receiverId: userId },
                ],
            }).sort({ createdAt: 1 }).populate("replyTo", "content senderId");
            res.status(200).json(messages);
        }
        catch (error) {
            next(error);
        }
    }
    async sendFriendRequest(req, res, next) {
        try {
            const myId = req.auth.userId;
            const { userId } = req.params;
            await User.updateOne({ clerkId: myId }, { $addToSet: { sentRequests: userId } });
            await User.updateOne({ clerkId: userId }, { $addToSet: { pendingRequests: myId } });
            const senderUser = await User.findOne({ clerkId: myId }).select("fullName imageUrl clerkId username");
            const receiverSocketId = userSockets.get(userId);
            if (receiverSocketId && io) {
                io.to(receiverSocketId).emit("friend_request_received", senderUser);
            }
            res.status(200).json({ success: true, message: "Friend request sent" });
        }
        catch (error) {
            next(error);
        }
    }
    async acceptFriendRequest(req, res, next) {
        try {
            const myId = req.auth.userId;
            const { userId } = req.params;
            await User.updateOne({ clerkId: myId }, {
                $pull: { pendingRequests: userId },
                $addToSet: { friends: userId },
            });
            await User.updateOne({ clerkId: userId }, {
                $pull: { sentRequests: myId },
                $addToSet: { friends: myId },
            });
            const accepterUser = await User.findOne({ clerkId: myId }).select("fullName imageUrl clerkId username");
            const senderSocketId = userSockets.get(userId);
            if (senderSocketId && io) {
                io.to(senderSocketId).emit("friend_request_accepted", accepterUser);
            }
            res.status(200).json({ success: true, message: "Friend request accepted" });
        }
        catch (error) {
            next(error);
        }
    }
    async rejectFriendRequest(req, res, next) {
        try {
            const myId = req.auth.userId;
            const { userId } = req.params;
            await User.updateOne({ clerkId: myId }, { $pull: { pendingRequests: userId } });
            await User.updateOne({ clerkId: userId }, { $pull: { sentRequests: myId } });
            res.status(200).json({ success: true, message: "Friend request rejected" });
        }
        catch (error) {
            next(error);
        }
    }
    async removeFriend(req, res, next) {
        try {
            const myId = req.auth.userId;
            const { userId } = req.params;
            await User.updateOne({ clerkId: myId }, { $pull: { friends: userId } });
            await User.updateOne({ clerkId: userId }, { $pull: { friends: myId } });
            res.status(200).json({ success: true, message: "Friend removed" });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { bio } = req.body;
            const imageFile = req.files?.imageFile;
            // Fetch current user first so we can compare values
            const currentUser = await User.findOne({ clerkId: userId });
            if (!currentUser)
                return res.status(404).json({ message: "User not found" });
            let imageUrl;
            if (imageFile) {
                const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
                    resource_type: "auto",
                });
                imageUrl = result.secure_url;
            }
            const updateData = {};
            if (bio !== undefined)
                updateData.bio = bio;
            if (imageUrl)
                updateData.imageUrl = imageUrl;
            if (req.body.fullName)
                updateData.fullName = req.body.fullName;
            if (req.body.username && req.body.username !== currentUser.username) {
                // Check if username is already taken by someone else
                const existingUser = await User.findOne({
                    username: new RegExp(`^${req.body.username}$`, 'i'),
                    clerkId: { $ne: userId }
                });
                if (existingUser) {
                    return res.status(400).json({ message: "Username already occupied" });
                }
                updateData.username = req.body.username;
            }
            if (req.body.favoriteSong !== undefined)
                updateData.favoriteSong = req.body.favoriteSong;
            if (req.body.favoriteArtist !== undefined)
                updateData.favoriteArtist = req.body.favoriteArtist;
            const user = await User.findOneAndUpdate({ clerkId: userId }, updateData, { new: true });
            res.status(200).json(user);
        }
        catch (error) {
            console.log("Error in updateProfile", error);
            next(error);
        }
    }
    async getMutualFriends(req, res, next) {
        try {
            const myId = req.auth.userId;
            const { userId } = req.params;
            const me = await User.findOne({ clerkId: myId });
            const otherUser = await User.findOne({ clerkId: userId });
            if (!me || !otherUser)
                return res.status(404).json({ message: "User not found" });
            const myFriends = me.friends || [];
            const theirFriends = otherUser.friends || [];
            const mutualIds = myFriends.filter(id => theirFriends.includes(id));
            const mutualFriends = await User.find({ clerkId: { $in: mutualIds } })
                .select("fullName imageUrl clerkId username");
            res.status(200).json(mutualFriends);
        }
        catch (error) {
            console.log("Error in getMutualFriends", error);
            next(error);
        }
    }
    async getFriends(req, res, next) {
        try {
            const { userId } = req.params;
            const user = await User.findOne({ clerkId: userId });
            if (!user)
                return res.status(404).json({ message: "User not found" });
            const friendIds = user.friends || [];
            const friends = await User.find({ clerkId: { $in: friendIds } })
                .select("fullName imageUrl clerkId username");
            res.status(200).json(friends);
        }
        catch (error) {
            console.log("Error in getFriends", error);
            next(error);
        }
    }
    async checkUsername(req, res, next) {
        try {
            const { username } = req.query;
            const myId = req.auth.userId;
            if (!username) {
                return res.status(400).json({ message: "Username is required" });
            }
            // Find if username exists and it's not the current user
            const existingUser = await User.findOne({
                username: new RegExp(`^${username}$`, 'i'),
                clerkId: { $ne: myId }
            });
            if (existingUser) {
                return res.status(200).json({ available: false, message: "Username already occupied" });
            }
            res.status(200).json({ available: true, message: "Username is available" });
        }
        catch (error) {
            console.log("Error in checkUsername", error);
            next(error);
        }
    }
    async recordPlay(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { songId } = req.body;
            if (!songId)
                return res.status(400).json({ message: "songId is required" });
            await PlayHistory.create({ userId, songId });
            // Notify recommender engine to clear cache or queue recalculation
            recommender.recordPlay(userId, songId);
            res.status(200).json({ message: "Play recorded" });
        }
        catch (error) {
            next(error);
        }
    }
    async getRecommendedUsers(req, res, next) {
        try {
            const userId = req.auth.userId;
            const topN = parseInt(req.query.limit) || 10;
            const myUser = await User.findOne({ clerkId: userId });
            const myFriends = myUser ? (myUser.friends || []) : [];
            // Get similar user IDs from the recommender (fetch more to account for filtered friends)
            const similarUserIdsRaw = recommender.getSimilarUsers(userId, 50);
            // Filter out users you already follow
            const similarUserIds = similarUserIdsRaw
                .filter(su => !myFriends.includes(su.userId))
                .slice(0, topN);
            if (similarUserIds.length === 0) {
                return res.status(200).json([]);
            }
            const clerkIds = similarUserIds.map(su => su.userId);
            // Fetch actual user details
            const users = await User.find({ clerkId: { $in: clerkIds } }).select("fullName imageUrl clerkId username bio");
            // Map the similarity scores to the user objects
            const usersWithScores = users.map(user => {
                const similarityData = similarUserIds.find(su => su.userId === user.clerkId);
                return {
                    ...user.toJSON(),
                    similarityScore: similarityData ? similarityData.score : 0,
                    matchDetails: similarityData ? similarityData.matchDetails : null
                };
            });
            // Sort by similarity score descending
            usersWithScores.sort((a, b) => b.similarityScore - a.similarityScore);
            res.status(200).json(usersWithScores);
        }
        catch (error) {
            console.log("Error in getRecommendedUsers", error);
            next(error);
        }
    }
    async getTimeTravelStats(req, res, next) {
        try {
            const userId = req.auth.userId;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            // Aggregate for top artist, top song, total minutes
            const stats = await PlayHistory.aggregate([
                { $match: { userId } },
                {
                    $lookup: {
                        from: "songs",
                        localField: "songId",
                        foreignField: "_id",
                        as: "song"
                    }
                },
                { $unwind: "$song" },
                {
                    $facet: {
                        "topSong": [
                            { $group: { _id: "$song", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 1 }
                        ],
                        "topArtist": [
                            { $group: { _id: "$song.artist", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 1 }
                        ],
                        "totalDuration": [
                            { $group: { _id: null, totalSeconds: { $sum: "$song.duration" } } }
                        ],
                        "thisMonthDuration": [
                            { $match: { playedAt: { $gte: startOfMonth } } },
                            { $group: { _id: null, totalSeconds: { $sum: "$song.duration" } } }
                        ],
                        "otherMonthDuration": [
                            { $match: { playedAt: { $lt: startOfMonth } } },
                            { $group: { _id: null, totalSeconds: { $sum: "$song.duration" } } }
                        ]
                    }
                }
            ]);
            const result = stats[0] || {};
            const topSong = result.topSong?.[0]?._id || null;
            const topArtist = result.topArtist?.[0]?._id || null;
            const totalMinutes = Math.floor((result.totalDuration?.[0]?.totalSeconds || 0) / 60);
            const thisMonthMinutes = Math.floor((result.thisMonthDuration?.[0]?.totalSeconds || 0) / 60);
            const otherMonthMinutes = Math.floor((result.otherMonthDuration?.[0]?.totalSeconds || 0) / 60);
            res.status(200).json({
                topSong,
                topArtist,
                totalMinutes,
                thisMonthMinutes,
                otherMonthMinutes
            });
        }
        catch (error) {
            console.log("Error in getTimeTravelStats", error);
            next(error);
        }
    }
    async toggleLikeSong(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { songId } = req.params;
            const user = await User.findOne({ clerkId: userId });
            if (!user)
                return res.status(404).json({ message: "User not found" });
            const index = user.likedSongs.findIndex((id) => id.toString() === songId.toString());
            if (index > -1) {
                user.likedSongs = user.likedSongs.filter((id) => id.toString() !== songId.toString());
            }
            else {
                user.likedSongs.push(songId);
            }
            await user.save();
            // Return populated liked songs after update
            const updatedUser = await User.findOne({ clerkId: userId }).populate("likedSongs");
            res.status(200).json(updatedUser.likedSongs);
        }
        catch (error) {
            console.log("Error in toggleLikeSong", error);
            next(error);
        }
    }
    async getLikedSongs(req, res, next) {
        try {
            const userId = req.auth.userId;
            const user = await User.findOne({ clerkId: userId }).populate("likedSongs");
            if (!user)
                return res.status(404).json({ message: "User not found" });
            res.status(200).json(user.likedSongs || []);
        }
        catch (error) {
            console.log("Error in getLikedSongs", error);
            next(error);
        }
    }
    async uploadMedia(req, res, next) {
        try {
            if (!req.files || !req.files.media) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const mediaFile = req.files.media;
            const resourceType = mediaFile.mimetype.startsWith("audio/") || mediaFile.name.endsWith(".webm") ? "video" : "auto";
            const result = await cloudinary.uploader.upload(mediaFile.tempFilePath, {
                resource_type: resourceType,
            });
            res.status(200).json({ url: result.secure_url });
        }
        catch (error) {
            console.log("Error in uploadMedia", error);
            next(error);
        }
    }
}
export default UserController;
