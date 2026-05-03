import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const getAllUsers = async (req, res, next) => {
	try {
		const currentUserId = req.auth.userId;
		const users = await User.find({ clerkId: { $ne: currentUserId } });

		const usersWithLastMessage = await Promise.all(
			users.map(async (user) => {
				const lastMessage = await Message.findOne({
					$or: [
						{ senderId: user.clerkId, receiverId: currentUserId },
						{ senderId: currentUserId, receiverId: user.clerkId },
					],
				}).sort({ createdAt: -1 });

				return {
					...user.toJSON(),
					lastMessage: lastMessage ? lastMessage.content : null,
				};
			})
		);

		res.status(200).json(usersWithLastMessage);
	} catch (error) {
		next(error);
	}
};

export const getMessages = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

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