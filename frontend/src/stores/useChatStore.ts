import { axiosInstance } from "@/lib/axios";
import type { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket: any;
	isConnected: boolean;
	onlineUsers: Set<string>;
	userActivities: Map<string, string>;
	messages: Message[];
	selectedUser: User | null;
	unreadMessages: Map<string, number>;
	replyingToMessage: Message | null;

	fetchUsers: () => Promise<void>;
	initSocket: (userId: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, senderId: string, content: string, replyToId?: string) => void;
	markMessagesAsRead: (senderId: string) => void;
	deleteMessage: (messageId: string) => void;
	reactToMessage: (messageId: string, emoji: string) => void;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null) => void;
	setReplyingToMessage: (message: Message | null) => void;
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

const socket = io(baseURL, {
	autoConnect: false, // only connect if user is authenticated
	withCredentials: true,
});

export const useChatStore = create<ChatStore>((set, get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket: socket,
	isConnected: false,
	onlineUsers: new Set(),
	userActivities: new Map(),
	messages: [],
	selectedUser: null,
	unreadMessages: new Map(),
	replyingToMessage: null,

	setReplyingToMessage: (message) => set({ replyingToMessage: message }),

	setSelectedUser: (user) => set((state) => {
		const newUnreadMessages = new Map(state.unreadMessages);
		if (user) {
			newUnreadMessages.delete(user.clerkId);
		}
		return { selectedUser: user, unreadMessages: newUnreadMessages };
	}),

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			set({ users: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId) => {
		if (!get().isConnected) {
			socket.auth = { userId };
			socket.connect();

			socket.emit("user_connected", userId);

			socket.on("users_online", (users: string[]) => {
				set({ onlineUsers: new Set(users) });
			});

			socket.on("activities", (activities: [string, string][]) => {
				set({ userActivities: new Map(activities) });
			});

			socket.on("user_connected", (userId: string) => {
				set((state) => ({
					onlineUsers: new Set([...state.onlineUsers, userId]),
				}));
			});

			socket.on("user_disconnected", (data: { userId: string, lastSeen: string } | string) => {
				const disconnectedUserId = typeof data === "string" ? data : data.userId;
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.delete(disconnectedUserId);

					const lastSeenTime = typeof data === "string" ? new Date().toISOString() : data.lastSeen;

					const newUsers = state.users.map(u => 
						u.clerkId === disconnectedUserId ? { ...u, lastSeen: lastSeenTime } : u
					);

					const newSelectedUser = state.selectedUser?.clerkId === disconnectedUserId
						? { ...state.selectedUser, lastSeen: lastSeenTime }
						: state.selectedUser;

					return { onlineUsers: newOnlineUsers, users: newUsers, selectedUser: newSelectedUser };
				});
			});

			socket.on("receive_message", (message: Message) => {
				set((state) => {
					const isCurrentlyChatting = state.selectedUser?.clerkId === message.senderId;
					const newUnreadMessages = new Map(state.unreadMessages);
					if (!isCurrentlyChatting) {
						newUnreadMessages.set(
							message.senderId,
							(newUnreadMessages.get(message.senderId) || 0) + 1
						);
					}

					const newUsers = state.users.map((user) => 
						user.clerkId === message.senderId ? { ...user, lastMessage: message.content } : user
					);

					return {
						messages: isCurrentlyChatting ? [...state.messages, message] : state.messages,
						unreadMessages: newUnreadMessages,
						users: newUsers,
					};
				});
			});

			socket.on("message_sent", (message: Message) => {
				set((state) => {
					const newUsers = state.users.map((user) => 
						user.clerkId === message.receiverId ? { ...user, lastMessage: message.content } : user
					);
					return {
						messages: [...state.messages, message],
						users: newUsers,
					};
				});
			});

			socket.on("activity_updated", ({ userId, activity }) => {
				set((state) => {
					const newActivities = new Map(state.userActivities);
					newActivities.set(userId, activity);
					return { userActivities: newActivities };
				});
			});

			socket.on("messages_marked_read", ({ receiverId }) => {
				set((state) => ({
					messages: state.messages.map((msg) =>
						msg.receiverId === receiverId ? { ...msg, isRead: true } : msg
					),
				}));
			});

			socket.on("message_deleted", (messageId: string) => {
				set((state) => ({
					messages: state.messages.filter((msg) => msg._id !== messageId),
				}));
			});

			socket.on("message_reacted", ({ messageId, reactions }) => {
				set((state) => ({
					messages: state.messages.map((msg) =>
						msg._id === messageId ? { ...msg, reactions } : msg
					),
				}));
			});

			set({ isConnected: true });
		}
	},

	disconnectSocket: () => {
		if (get().isConnected) {
			socket.disconnect();
			set({ isConnected: false });
		}
	},

	sendMessage: async (receiverId, senderId, content, replyToId) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("send_message", { receiverId, senderId, content, replyToId });
		set({ replyingToMessage: null });
	},

	markMessagesAsRead: (senderId: string) => {
		const socket = get().socket;
		if (!socket || !socket.auth || !socket.auth.userId) return;
		
		// Update local state for immediate feedback
		set((state) => ({
			messages: state.messages.map(msg => 
				msg.senderId === senderId && !msg.isRead ? { ...msg, isRead: true } : msg
			)
		}));

		socket.emit("mark_messages_read", { senderId, receiverId: socket.auth.userId });
	},

	deleteMessage: (messageId: string) => {
		const socket = get().socket;
		if (!socket || !socket.auth || !socket.auth.userId) return;
		socket.emit("delete_message", { messageId, senderId: socket.auth.userId });
	},

	reactToMessage: (messageId: string, emoji: string) => {
		const socket = get().socket;
		if (!socket || !socket.auth || !socket.auth.userId) return;
		socket.emit("react_message", { messageId, senderId: socket.auth.userId, emoji });
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},
}));