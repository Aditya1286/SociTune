import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";
import { socificationService } from "../services/socification.service.js";
class NotificationController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.auth.userId;
            // Fetch notifications from the database
            let notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
            // If there are no notifications, seed some initial realistic notifications using real DB data
            if (notifications.length === 0) {
                const now = new Date();
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
                const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
                const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
                // Fetch real users and songs
                const realUsers = await User.find({ clerkId: { $ne: userId } }).limit(5);
                const realSongs = await Song.find({}).limit(5);
                const getUser = (index, defaultName, defaultAvatar, defaultClerkId) => {
                    if (realUsers.length > index) {
                        return {
                            name: realUsers[index].fullName,
                            avatar: realUsers[index].imageUrl || defaultAvatar,
                            clerkId: realUsers[index].clerkId
                        };
                    }
                    return { name: defaultName, avatar: defaultAvatar, clerkId: defaultClerkId };
                };
                const getSong = (index, defaultTitle, defaultArtist, defaultArtwork) => {
                    if (realSongs.length > index) {
                        return {
                            id: realSongs[index]._id.toString(),
                            title: realSongs[index].title,
                            artist: realSongs[index].artist,
                            artwork: realSongs[index].imageUrl || defaultArtwork
                        };
                    }
                    return { id: `mock_song_${index}`, title: defaultTitle, artist: defaultArtist, artwork: defaultArtwork };
                };
                const user1 = getUser(0, "Aman", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200", "clerk_aman_mock");
                const user2 = getUser(1, "Kiara", "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200", "clerk_kiara_mock");
                const user3 = getUser(2, "Ananya", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200", "clerk_ananya_mock");
                const user4 = getUser(3, "Shruti", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200", "clerk_shruti_mock");
                const song1 = getSong(0, "Starboy", "The Weeknd", "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300");
                const song2 = getSong(1, "Tum Hi Ho", "Arijit Singh", "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300");
                const mockNotifications = [
                    {
                        userId,
                        type: "music",
                        title: `${user1.name} is Listening Live`,
                        message: `${user1.name} is listening to '${song1.title}' by ${song1.artist} right now. Tune in with them!`,
                        isRead: false,
                        createdAt: now,
                        metadata: {
                            songId: song1.id,
                            songTitle: song1.title,
                            songArtist: song1.artist,
                            songArtwork: song1.artwork,
                            artistImage: user1.avatar,
                            listeningStatus: "playing"
                        }
                    },
                    {
                        userId,
                        type: "music",
                        title: "New Taste Match Found!",
                        message: `You have a 92% music compatibility match with ${user2.name}! You both share artists like ${song1.artist} and ${song2.artist}.`,
                        isRead: false,
                        createdAt: oneHourAgo,
                        metadata: {
                            matchPercentage: 92,
                            sharedArtists: [song1.artist, song2.artist],
                            matchUserId: user2.clerkId
                        }
                    },
                    {
                        userId,
                        senderId: user3.clerkId,
                        senderName: user3.name,
                        senderAvatar: user3.avatar,
                        type: "messages",
                        title: "Unread Message",
                        message: `${user3.name} sent you a message: 'Hey! Are you going to the concert this weekend?'`,
                        isRead: false,
                        createdAt: fiveHoursAgo
                    },
                    {
                        userId,
                        type: "ai",
                        title: "Weekly AI Taste Profile Ready",
                        message: "Your music personality this week is 'Melodic Dreamer'. You lean 78% towards chill, energetic, and happy tunes.",
                        isRead: false,
                        createdAt: oneDayAgo,
                        metadata: {
                            musicPersonality: "Melodic Dreamer",
                            moodTrend: ["Chill", "Energetic", "Happy"],
                            recommendations: [`${song1.title} - ${song1.artist}`, `${song2.title} - ${song2.artist}`]
                        }
                    },
                    {
                        userId,
                        type: "music",
                        title: "Trending Playlist Spotlight",
                        message: "The DHH Hits playlist is exploding on SociTune today. 1.2k listeners tuned in this afternoon!",
                        isRead: true,
                        createdAt: twoDaysAgo,
                        metadata: {
                            playlistCoverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
                            genreBadge: "DHH",
                            playlistId: "mock_playlist_dhh"
                        }
                    },
                    {
                        userId,
                        senderId: user4.clerkId,
                        senderName: user4.name,
                        senderAvatar: user4.avatar,
                        type: "social",
                        title: "Friend Request Accepted",
                        message: `${user4.name} accepted your friend request! You can now view their live activity.`,
                        isRead: true,
                        createdAt: fourDaysAgo
                    },
                    {
                        userId,
                        type: "system",
                        title: "Welcome to SociTune Premium!",
                        message: "You've unlocked full taste match history and access to non-followers' activity feeds.",
                        isRead: true,
                        createdAt: sixDaysAgo
                    }
                ];
                await Notification.insertMany(mockNotifications);
                notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
            }
            res.status(200).json(notifications);
        }
        catch (error) {
            next(error);
        }
    }
    async markAllRead(req, res, next) {
        try {
            const userId = req.auth.userId;
            await socificationService.markAllRead(userId);
            res.status(200).json({ success: true, message: "All notifications marked as read." });
        }
        catch (error) {
            next(error);
        }
    }
    async markRead(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.auth.userId;
            await socificationService.markRead(userId, id);
            res.status(200).json({ success: true, message: "Notification marked as read." });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteNotification(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.auth.userId;
            await socificationService.deleteNotification(userId, id);
            res.status(200).json({ success: true, message: "Notification deleted." });
        }
        catch (error) {
            next(error);
        }
    }
}
export default NotificationController;
