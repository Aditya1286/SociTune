import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllUsers = async (req, res, next) => {
	try {
		const currentUserId = req.auth.userId;
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

				if (isFriend) {
					const lastMessage = await Message.findOne({
						$or: [
							{ senderId: user.clerkId, receiverId: currentUserId },
							{ senderId: currentUserId, receiverId: user.clerkId },
						],
					}).sort({ createdAt: -1 });
					lastMessageContent = lastMessage ? lastMessage.content : null;
				}

				return {
					...user.toJSON(),
					lastMessage: lastMessageContent,
					isFriend,
					isPending,
					isSent,
					mutualFriendsCount,
					lastActivity: isFriend ? user.lastActivity : undefined,
				};
			})
		);

		res.status(200).json(usersWithDetails);
	} catch (error) {
		next(error);
	}
};

export const getMessages = async (req, res, next) => {
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
	} catch (error) {
		next(error);
	}
};

export const sendFriendRequest = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

		await User.updateOne({ clerkId: myId }, { $addToSet: { sentRequests: userId } });
		await User.updateOne({ clerkId: userId }, { $addToSet: { pendingRequests: myId } });

		res.status(200).json({ success: true, message: "Friend request sent" });
	} catch (error) {
		next(error);
	}
};

export const acceptFriendRequest = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
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

		res.status(200).json({ success: true, message: "Friend request accepted" });
	} catch (error) {
		next(error);
	}
};

export const rejectFriendRequest = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
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
};

export const removeFriend = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
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
};

export const updateProfile = async (req, res, next) => {
	try {
		const userId = req.auth.userId;
		const { bio } = req.body;
		const imageFile = req.files?.imageFile;

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

		const updateData = {};
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
};

export const getMutualFriends = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
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
};

export const checkUsername = async (req, res, next) => {
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
	} catch (error) {
		console.log("Error in checkUsername", error);
		next(error);
	}
};