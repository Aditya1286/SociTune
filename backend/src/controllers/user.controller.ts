import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { PlayHistory } from "../models/playHistory.model.js";
import { Song } from "../models/song.model.js";
import { generateSongId } from "../helpers/generateSongId.js";
import cloudinary from "../services/cloudinary.service.js";
import { recommender } from "../services/recommendation.service.js";
import { io, userSockets } from "../services/socket.service.js";
import { socificationService } from "../services/socification.service.js";

class UserController {

	//Ok
public async getAllUsers(req: Request, res: Response, next: NextFunction) {
	try {
		
		const currentUserId = (req as any).auth.userId;
		const currentUser = await User.findOne({ clerkId: currentUserId });
		
		const users = await User.find({ clerkId: { $ne: currentUserId } });

		const usersWithDetails = await Promise.all(
			users.map(async (user) => {
				const isFriend = currentUser.friends.includes(user.clerkId);
				const isPending = currentUser.pendingRequests.includes(user.clerkId);
				const isSent = currentUser.sentRequests.includes(user.clerkId);
				
				// Calculate mutual friends
				const mutualFriends = user.friends.filter(f => currentUser.friends.includes(f));
				const mutualFriendsCount = mutualFriends.length;

				let lastMessageContent = null;
				let lastMessageAt = null;
				let unreadCount = 0;

				if (isFriend) {
					const lastMessage = await Message.findOne({
						$or: [
							{ senderId: user.clerkId, receiverId: currentUserId },
							{ senderId: currentUserId, receiverId: user.clerkId },
						],
					}).sort({ createdAt: -1 });
					lastMessageContent = lastMessage ? lastMessage.content : null;
					lastMessageAt = lastMessage ? lastMessage.createdAt : null;

					unreadCount = await Message.countDocuments({
						senderId: user.clerkId,
						receiverId: currentUserId,
						isRead: false
					});
				}

				return {
					...user.toJSON(),
					lastMessage: lastMessageContent,
					lastMessageAt,
					unreadCount,
					isFriend,
					isPending,
					isSent,
					mutualFriendsCount,
					lastActivity: isFriend ? user.lastActivity : undefined,
				}
			})
		);

		res.status(200).json(usersWithDetails);
	} catch (error) {
		next(error);
	}
}

public async getMessages(req: Request, res: Response, next: NextFunction) {
	try {
		const myId = (req as any).auth.userId;
		const { userId } = req.params;

		// Optional: check if they are friends before allowing message fetch
		const currentUser = await User.findOne({ clerkId: myId });
		if (!currentUser.friends.includes(userId as string)) {
			return res.status(403).json({ message: "You must be friends to view messages." });
		}

		const messages = await Message.find({
			$or: [
				{ senderId: userId, receiverId: myId },
				{ senderId: myId, receiverId: userId },
			],
		}).sort({ createdAt: 1 }).populate("replyTo", "content senderId");

		res.status(200).json(messages);
	} catch (error) {
		next(error);
	}
}

public async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
	try {
		const myId = (req as any).auth.userId;
		const { userId } = req.params;

		await User.updateOne({ clerkId: myId }, { $addToSet: { sentRequests: userId } });
		await User.updateOne({ clerkId: userId }, { $addToSet: { pendingRequests: myId } });

		const senderUser = await User.findOne({ clerkId: myId }).select("fullName imageUrl clerkId username");
		
		// Create and store the notification in the database via socificationService
		await socificationService.createNotification({
			userId: userId as string,
			senderId: myId,
			senderName: senderUser.fullName,
			senderAvatar: senderUser.imageUrl,
			type: "social",
			title: "New Friend Request",
			message: `${senderUser.fullName} sent you a friend request.`,
			metadata: {
				matchUserId: myId
			}
		});

		const receiverSocketId = userSockets.get(userId as string);
		if (receiverSocketId && io) {
			io.to(receiverSocketId).emit("friend_request_received", senderUser);
		}

		res.status(200).json({ success: true, message: "Friend request sent" });
	} catch (error) {
		next(error);
	}
}

public async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
	try {
		const myId = (req as any).auth.userId;
		const { userId } = req.params;

		await User.updateOne(
			{ clerkId: myId },
			{
				$pull: { pendingRequests: userId },
				$addToSet: { friends: userId },
			}
		);

		await User.updateOne(
			{ clerkId: userId },
			{
				$pull: { sentRequests: myId },
				$addToSet: { friends: myId },
			}
		);

		const accepterUser = await User.findOne({ clerkId: myId }).select("fullName imageUrl clerkId username");

		// Create and store the notification in the database via socificationService
		await socificationService.createNotification({
			userId: userId as string,
			senderId: myId,
			senderName: accepterUser.fullName,
			senderAvatar: accepterUser.imageUrl,
			type: "social",
			title: "Friend Request Accepted",
			message: `${accepterUser.fullName} accepted your friend request!`,
			metadata: {
				matchUserId: myId
			}
		});

		const senderSocketId = userSockets.get(userId as string);
		if (senderSocketId && io) {
			io.to(senderSocketId).emit("friend_request_accepted", accepterUser);
		}

		res.status(200).json({ success: true, message: "Friend request accepted" });
	} catch (error) {
		next(error);
	}
}

public async rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
	try {
		const myId = (req as any).auth.userId;
		const { userId } = req.params;

		await User.updateOne(
			{ clerkId: myId },
			{ $pull: { pendingRequests: userId } }
		);

		await User.updateOne(
			{ clerkId: userId },
			{ $pull: { sentRequests: myId } }
		);

		res.status(200).json({ success: true, message: "Friend request rejected" });
	} catch (error) {
		next(error);
	}
}

public async removeFriend(req: Request, res: Response, next: NextFunction) {
	try {
		const myId = (req as any).auth.userId;
		const { userId } = req.params;

		await User.updateOne(
			{ clerkId: myId },
			{ $pull: { friends: userId } }
		);

		await User.updateOne(
			{ clerkId: userId },
			{ $pull: { friends: myId } }
		);

		res.status(200).json({ success: true, message: "Friend removed" });
	} catch (error) {
		next(error);
	}
}

	public async getCurrentUser(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = (req as any).auth.userId;
			const user = await User.findOne({ clerkId: userId });
			if (!user) return res.status(404).json({ message: "User not found" });
			res.status(200).json(user);
		} catch (error) {
			console.log("Error in getCurrentUser", error);
			next(error);
		}
	}

	public async updateProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = (req as any).auth.userId;
			const { bio } = req.body;
			const imageFile = (req as any).files?.imageFile;

			// Fetch current user first so we can compare values
			const currentUser = await User.findOne({ clerkId: userId });
			if (!currentUser) return res.status(404).json({ message: "User not found" });

			let imageUrl;
			if (imageFile) {
				const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
					resource_type: "auto",
				});
				imageUrl = result.secure_url;
			}

			const updateData: any = {}
			if (bio !== undefined) updateData.bio = bio;
			if (imageUrl) updateData.imageUrl = imageUrl;
			if (req.body.fullName) updateData.fullName = req.body.fullName;
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
			if (req.body.favoriteSong !== undefined) updateData.favoriteSong = req.body.favoriteSong;
			if (req.body.favoriteArtist !== undefined) updateData.favoriteArtist = req.body.favoriteArtist;
			if (req.body.displayName !== undefined) updateData.displayName = req.body.displayName;
			if (req.body.gender !== undefined) updateData.gender = req.body.gender;
			if (req.body.birthday !== undefined) updateData.birthday = req.body.birthday ? new Date(req.body.birthday) : null;
			if (req.body.country !== undefined) updateData.country = req.body.country;
			if (req.body.profileCompleted !== undefined) {
				// Coerce string "true" / "false" to boolean if sent as FormData
				updateData.profileCompleted = req.body.profileCompleted === "true" || req.body.profileCompleted === true;
			}

			const user = await User.findOneAndUpdate(
				{ clerkId: userId },
				updateData,
				{ new: true }
			);

			res.status(200).json(user);
		} catch (error) {
			console.log("Error in updateProfile", error);
			next(error);
		}
	}

public async getMutualFriends(req: Request, res: Response, next: NextFunction) {
	try {
		const myId = (req as any).auth.userId;
		const { userId } = req.params;

		const me = await User.findOne({ clerkId: myId });
		const otherUser = await User.findOne({ clerkId: userId });

		if (!me || !otherUser) return res.status(404).json({ message: "User not found" });

		const myFriends = me.friends || [];
		const theirFriends = otherUser.friends || [];
		const mutualIds = myFriends.filter(id => theirFriends.includes(id));

		const mutualFriends = await User.find({ clerkId: { $in: mutualIds } })
			.select("fullName imageUrl clerkId username");

		res.status(200).json(mutualFriends);
	} catch (error) {
		console.log("Error in getMutualFriends", error);
		next(error);
	}
}

public async getFriends(req: Request, res: Response, next: NextFunction) {
	try {
		const { userId } = req.params;

		const user = await User.findOne({ clerkId: userId });

		if (!user) return res.status(404).json({ message: "User not found" });

		const friendIds = user.friends || [];

		const friends = await User.find({ clerkId: { $in: friendIds } })
			.select("fullName imageUrl clerkId username");

		res.status(200).json(friends);
	} catch (error) {
		console.log("Error in getFriends", error);
		next(error);
	}
}

public async checkUsername(req: Request, res: Response, next: NextFunction) {
	try {
		const { username } = req.query;
		const myId = (req as any).auth.userId;

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
	} catch (error) {
		console.log("Error in checkUsername", error);
		next(error);
	}
}

public async recordPlay(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = (req as any).auth.userId;
		let songId = req.body.songId;
		let spotifyId = req.body.spotifyId;
		let title = req.body.title;
		let artist = req.body.artist;
		let imageUrl = req.body.imageUrl;
		let duration = req.body.duration;

		let durationMsStr = req.body.durationMs !== undefined ? req.body.durationMs : req.body.duration_ms;
		let completed = req.body.completed;
		let sessionId = req.body.sessionId !== undefined ? req.body.sessionId : req.body.session_id;
		let source = req.body.source;
		let playedAtVal = req.body.playedAt || req.body.played_at ? new Date(req.body.playedAt || req.body.played_at) : new Date();

		// If the request contains the new payload structure, parse it
		if (req.body.song_details) {
			const { song_details } = req.body;
			title = song_details.title;
			artist = song_details.artist;
			imageUrl = song_details.image_url;
			duration = song_details.duration;
			
			const externalIds = song_details.external_ids || {};
			spotifyId = externalIds.spotify_id;
			const fuzzyId = externalIds.fuzzy_id || generateSongId(title, artist);
			
			// Try to find the song by spotifyId, fuzzyId, or title/artist
			let song = null;
			if (spotifyId) {
				song = await Song.findOne({ "external_ids.spotify_id": spotifyId });
			}
			if (!song && fuzzyId) {
				song = await Song.findOne({ "external_ids.fuzzy_id": fuzzyId });
			}
			if (!song && title && artist) {
				const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const escapedArtist = artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				song = await Song.findOne({
					title: { $regex: new RegExp(`^${escapedTitle}$`, "i") },
					artist: { $regex: new RegExp(`^${escapedArtist}$`, "i") }
				});
			}

			if (song) {
				songId = song._id;
				// If existing song doesn't have details, update them
				let needsUpdate = false;
				const updateFields: any = {};
				
				if (spotifyId && song.external_ids?.spotify_id !== spotifyId) {
					updateFields["external_ids.spotify_id"] = spotifyId;
					needsUpdate = true;
				}
				if (song_details.audio_details && (!song.audio_details || !song.audio_details.tempo)) {
					updateFields.audio_details = song_details.audio_details;
					needsUpdate = true;
				}
				if (song_details.lyrics_details?.lyrics && (!song.lyrics || song.lyricsSource === "None")) {
					updateFields.lyrics = song_details.lyrics_details.lyrics;
					updateFields.lyricsSource = song_details.lyrics_details.lyricsSource;
					updateFields.lyricsFetchedAt = song_details.lyrics_details.lyricsFetchedAt ? new Date(song_details.lyrics_details.lyricsFetchedAt) : new Date();
					needsUpdate = true;
				}
				
				if (needsUpdate) {
					await Song.updateOne({ _id: song._id }, { $set: updateFields });
				}
			} else if (title && artist) {
				// Create a new song document with details
				song = new Song({
					title,
					artist,
					imageUrl: imageUrl || "/albums/default.jpg",
					audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
					duration: Number(duration) || 180,
					genre: song_details.primary_genre || "Hip Hop",
					audio_details: song_details.audio_details || {
						tempo: Math.floor(Math.random() * (180 - 60 + 1) + 60),
						energy: Math.random(),
						valence: Math.random(),
						acousticness: Math.random(),
						danceability: Math.random()
					},
					lyrics: song_details.lyrics_details?.lyrics || null,
					lyricsSource: song_details.lyrics_details?.lyricsSource || "None",
					lyricsFetchedAt: song_details.lyrics_details?.lyricsFetchedAt ? new Date(song_details.lyrics_details.lyricsFetchedAt) : null,
					external_ids: {
						spotify_id: spotifyId,
						isrc_id: externalIds.isrc_id,
						yt_id: externalIds.yt_id,
						fuzzy_id: fuzzyId
					}
				});
				await song.save();
				
				// Setup artist connections
				try {
					const { Artist } = await import("../models/artist.model.js");
					const { parseArtistNames } = await import("../utils/artistParser.js");
					
					const artistNames = parseArtistNames(artist);
					const artistIds: any[] = [];
					
					for (const name of artistNames) {
						const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
						let artistDoc = await Artist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
						if (!artistDoc) {
							artistDoc = new Artist({
								name: name,
								imageUrl: imageUrl || "/albums/default.jpg",
								monthlyListeners: Math.floor(Math.random() * (1200000 - 15000 + 1) + 15000),
								followers: Math.floor(Math.random() * (600000 - 8000 + 1) + 8000),
								genres: ["Indian Hip Hop", "Pop", "Desi Hip Hop"],
								bio: `${name} is a featured artist on SociTune.`,
								verified: Math.random() > 0.5
							});
							await artistDoc.save();
						}
						
						if (!artistDoc.songs.includes(song._id as any)) {
							artistDoc.songs.push(song._id as any);
							await artistDoc.save();
						}
						artistIds.push(artistDoc._id);
					}
					
					song.set("artists", artistIds);
					await song.save();
				} catch (err) {
					console.error("Error setting artist links:", err);
				}

				songId = song._id;
			}
		} else {
			// Handle legacy payload (only songId or spotifyId provided directly)
			if (!songId && spotifyId) {
				let song = await Song.findOne({ "external_ids.spotify_id": spotifyId });
				if (!song && title && artist) {
					const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const escapedArtist = artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					song = await Song.findOne({
						title: { $regex: new RegExp(`^${escapedTitle}$`, "i") },
						artist: { $regex: new RegExp(`^${escapedArtist}$`, "i") }
					});
					
					if (song) {
						await Song.updateOne(
							{ _id: song._id },
							{ $set: { "external_ids.spotify_id": spotifyId } }
						);
					}
				}

				if (!song && title && artist) {
					const fuzzyId = generateSongId(title, artist);
					song = new Song({
						title,
						artist,
						imageUrl: imageUrl || "/albums/default.jpg",
						audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
						duration: Number(duration) || 180,
						genre: "Hip Hop",
						tempo: Math.floor(Math.random() * (180 - 60 + 1) + 60),
						energy: Math.random(),
						valence: Math.random(),
						acousticness: Math.random(),
						danceability: Math.random(),
						external_ids: {
							spotify_id: spotifyId,
							fuzzy_id: fuzzyId
						}
					});
					await song.save();

					try {
						const { Artist } = await import("../models/artist.model.js");
						const { parseArtistNames } = await import("../utils/artistParser.js");
						
						const artistNames = parseArtistNames(artist);
						const artistIds: any[] = [];
						
						for (const name of artistNames) {
							const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
							let artistDoc = await Artist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
							if (!artistDoc) {
								artistDoc = new Artist({
									name: name,
									imageUrl: imageUrl || "/albums/default.jpg",
									monthlyListeners: Math.floor(Math.random() * (1200000 - 15000 + 1) + 15000),
									followers: Math.floor(Math.random() * (600000 - 8000 + 1) + 8000),
									genres: ["Indian Hip Hop", "Pop", "Desi Hip Hop"],
									bio: `${name} is a featured artist on SociTune.`,
									verified: Math.random() > 0.5
								});
								await artistDoc.save();
							}
							
							if (!artistDoc.songs.includes(song._id as any)) {
								artistDoc.songs.push(song._id as any);
								await artistDoc.save();
							}
							artistIds.push(artistDoc._id);
						}
						
						song.set("artists", artistIds);
						await song.save();
					} catch (err) {
						console.error("Error setting artist links:", err);
					}
				}

				if (song) {
					songId = song._id;
				} else {
					return res.status(400).json({ message: "Song details are incomplete to register new track" });
				}
			}
		}

		if (!songId) {
			return res.status(400).json({ message: "songId could not be determined" });
		}

		// Create play history record in DB
		const playHistoryObj: any = {
			userId,
			songId,
			playedAt: playedAtVal
		};
		if (durationMsStr !== undefined) playHistoryObj.durationMs = durationMsStr;
		if (completed !== undefined) playHistoryObj.completed = completed;
		if (sessionId !== undefined) playHistoryObj.sessionId = sessionId;
		if (source !== undefined) playHistoryObj.source = source;

		await PlayHistory.create(playHistoryObj);
		
		// Notify recommender engine
		recommender.recordPlay(userId, songId);

		// Async send to Docker AI service
		if (req.body.song_details) {
			// If it's the new payload, forward it
			const { dockerAiService } = await import("../services/dockerAi.service.js");
			dockerAiService.sendListeningEvent(req.body).catch(err => {
				console.error("[recordPlay] Failed to forward listening event to Docker AI service:", err);
			});
		} else {
			// If it's the legacy payload, construct the new payload format to forward
			const songDoc = await Song.findById(songId);
			if (songDoc) {
				const constructedPayload = {
					song_details: {
						title: songDoc.title,
						artist: songDoc.artist,
						external_ids: {
							spotify_id: songDoc.external_ids?.spotify_id,
							isrc_id: songDoc.external_ids?.isrc_id,
							yt_id: songDoc.external_ids?.yt_id,
							fuzzy_id: songDoc.external_ids?.fuzzy_id
						},
						primary_genre: songDoc.genre || "unknown",
						duration: String(songDoc.duration),
						audio_details: songDoc.audio_details ? {
							tempo: songDoc.audio_details.tempo || 0,
							energy: songDoc.audio_details.energy || 0,
							valence: songDoc.audio_details.valence || 0,
							acousticness: songDoc.audio_details.acousticness || 0,
							danceability: songDoc.audio_details.danceability || 0
						} : undefined,
						lyrics_details: songDoc.lyrics ? {
							lyrics: songDoc.lyrics,
							lyricsSource: songDoc.lyricsSource || "Unknown",
							lyricsFetchedAt: songDoc.lyricsFetchedAt
						} : undefined,
						image_url: songDoc.imageUrl
					},
					played_at: playedAtVal.toISOString(),
					duration_ms: durationMsStr || "0",
					completed: completed || false,
					session_id: sessionId,
					source: source || "organic"
				};
				const { dockerAiService } = await import("../services/dockerAi.service.js");
				dockerAiService.sendListeningEvent(constructedPayload).catch(err => {
					console.error("[recordPlay] Failed to forward constructed listening event to Docker AI service:", err);
				});
			}
		}
		
		res.status(200).json({ message: "Play recorded", songId });
	} catch (error) {
		console.error("Error in recordPlay:", error);
		next(error);
	}
}

public async getRecommendedUsers(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = (req as any).auth.userId;
		const topN = parseInt(req.query.limit as string) || 10;
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
			}
		});
		
		// Sort by similarity score descending
		usersWithScores.sort((a, b) => b.similarityScore - a.similarityScore);
		
		res.status(200).json(usersWithScores);
	} catch (error) {
		console.log("Error in getRecommendedUsers", error);
		next(error);
	}
}

public async getTimeTravelStats(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = (req as any).auth.userId;

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
					"topArtists": [
						{ $unwind: "$song.artists" },
						{ $group: { _id: "$song.artists", count: { $sum: 1 } } },
						{ $sort: { count: -1 } },
						{ $limit: 5 },
						{
							$lookup: {
								from: "artists",
								localField: "_id",
								foreignField: "_id",
								as: "artistDetails"
							}
						},
						{ $unwind: "$artistDetails" }
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
					],
					"monthlyActivity": [
						{
							$group: {
								_id: {
									year: { $year: "$playedAt" },
									month: { $month: "$playedAt" }
								},
								totalSeconds: { $sum: "$song.duration" }
							}
						},
						{ $sort: { "_id.year": 1, "_id.month": 1 } }
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

		// Format monthlyStats for the last 6 months
		const monthlyActivity = result.monthlyActivity || [];
		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		const monthlyStats = [];
		const currentDate = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
			const year = d.getFullYear();
			const monthVal = d.getMonth() + 1; // 1-indexed for MongoDB $month
			
			const record = monthlyActivity.find((act: any) => act._id?.year === year && act._id?.month === monthVal);
			const mins = Math.floor((record?.totalSeconds || 0) / 60);
			
			monthlyStats.push({
				name: monthNames[d.getMonth()],
				mins: mins
			});
		}

		// Process topArtists details
		let topArtists = result.topArtists?.map((item: any) => ({
			_id: item.artistDetails._id,
			name: item.artistDetails.name,
			imageUrl: item.artistDetails.imageUrl,
			count: item.count
		})) || [];

		// Fallback to name string lookup if artists array grouping returned nothing
		if (topArtists.length === 0 && topArtist) {
			const { Artist } = await import("../models/artist.model.js");
			const artistDoc = await Artist.findOne({
				name: { $regex: new RegExp(`^${topArtist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
			});
			if (artistDoc) {
				topArtists = [{
					_id: artistDoc._id,
					name: artistDoc.name,
					imageUrl: artistDoc.imageUrl,
					count: 1
				}];
			}
		}

		res.status(200).json({
			topSong,
			topArtist,
			topArtists,
			totalMinutes,
			thisMonthMinutes,
			otherMonthMinutes,
			monthlyStats
		});
	} catch (error) {
		console.log("Error in getTimeTravelStats", error);
		next(error);
	}
}

public async toggleLikeSong(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = (req as any).auth.userId;
		const songId = req.params.songId as string;
		const { title, artist, imageUrl, duration } = req.body;

		const user = await User.findOne({ clerkId: userId });
		if (!user) return res.status(404).json({ message: "User not found" });

		let songDoc = null;

		// 1. Try finding by MongoDB ObjectId first (if it looks like one)
		const mongoose = await import("mongoose");
		if (mongoose.default.Types.ObjectId.isValid(songId)) {
			songDoc = await Song.findById(songId);
		}

		// 2. If not found by ID, try finding by Spotify ID
		if (!songDoc) {
			songDoc = await Song.findOne({ "external_ids.spotify_id": songId } as any);
		}

		// 3. If still not found, check if we have enough info to search by fuzzy_id or create a new song
		if (!songDoc && title && artist) {
			const fuzzyId = generateSongId(title, artist);
			songDoc = await Song.findOne({ "external_ids.fuzzy_id": fuzzyId } as any);

			// If still not found, create a new Song record dynamically
			if (!songDoc) {
				songDoc = await Song.create({
					title,
					artist,
					duration: Math.round(Number(duration) || 0),
					imageUrl: imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
					external_ids: {
						spotify_id: songId,
						fuzzy_id: fuzzyId,
					},
					audio_details: {
						tempo: 120,
						energy: 0.5,
						valence: 0.5,
						acousticness: 0.5,
						danceability: 0.5,
					}
				} as any);
			}
		}

		if (!songDoc) {
			return res.status(404).json({ message: "Song not found and not enough details provided to create it" });
		}

		const index = user.likedSongs.findIndex((id) => id.toString() === songDoc._id.toString());
		if (index > -1) {
			user.likedSongs = user.likedSongs.filter((id) => id.toString() !== songDoc._id.toString());
		} else {
			user.likedSongs.push(songDoc._id as any);
		}

		await user.save();
		
		// Return populated liked songs after update
		const updatedUser = await User.findOne({ clerkId: userId }).populate("likedSongs");
		res.status(200).json(updatedUser.likedSongs);
	} catch (error) {
		console.log("Error in toggleLikeSong", error);
		next(error);
	}
}

public async getLikedSongs(req: Request, res: Response, next: NextFunction) {
	try {
		const userId = (req as any).auth.userId;
		const user = await User.findOne({ clerkId: userId }).populate("likedSongs");
		
		if (!user) return res.status(404).json({ message: "User not found" });
		
		res.status(200).json(user.likedSongs || []);
	} catch (error) {
		console.log("Error in getLikedSongs", error);
		next(error);
	}
}

public async uploadMedia(req: Request, res: Response, next: NextFunction) {
	try {
		if (!(req as any).files || !(req as any).files.media) {
			return res.status(400).json({ message: "No file uploaded" });
		}
		const mediaFile = (req as any).files.media;
		const resourceType = mediaFile.mimetype.startsWith("audio/") || mediaFile.name.endsWith(".webm") ? "video" : "auto";
		const result = await cloudinary.uploader.upload(mediaFile.tempFilePath, {
			resource_type: resourceType,
		});
		res.status(200).json({ url: result.secure_url });
	} catch (error) {
		console.log("Error in uploadMedia", error);
		next(error);
	}
}
}

export default UserController;
