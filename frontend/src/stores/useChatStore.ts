import { axiosInstance } from "@/lib/axios";
import type { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore";

interface ChatStore {
	users: User[];
	recommendations: User[];
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
	showProfilePanel: boolean;
	viewState: 'profile' | 'chat';
	profileSource: 'chat' | 'discover';

	fetchUsers: () => Promise<void>;
	fetchRecommendations: () => Promise<void>;
	initSocket: (userId: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, senderId: string, content: string, replyToId?: string, imageUrl?: string, voiceNoteUrl?: string) => void;
	markMessagesAsRead: (senderId: string) => void;
	deleteMessage: (messageId: string) => void;
	reactToMessage: (messageId: string, emoji: string) => void;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null, targetViewState?: 'profile' | 'chat') => void;
	setReplyingToMessage: (message: Message | null) => void;
	setShowProfilePanel: (show: boolean) => void;
	setViewState: (viewState: 'profile' | 'chat') => void;
	sendFriendRequest: (userId: string) => Promise<void>;
	acceptFriendRequest: (userId: string) => Promise<void>;
	rejectFriendRequest: (userId: string) => Promise<void>;
	removeFriend: (userId: string) => Promise<void>;
	updateProfile: (formData: FormData) => Promise<void>;
	getMutualFriends: (userId: string) => Promise<User[]>;
	getUserFriends: (userId: string) => Promise<User[]>;
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

const socket = io(baseURL, {
	autoConnect: false, // only connect if user is authenticated
	withCredentials: true,
});

export const useChatStore = create<ChatStore>((set, get) => ({
	users: [],
	recommendations: [],
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
	showProfilePanel: false,
	viewState: 'profile',
	profileSource: 'discover',

	setReplyingToMessage: (message) => set({ replyingToMessage: message }),
	setShowProfilePanel: (show) => set({ showProfilePanel: show }),
	setViewState: (viewState) => set({ viewState }),

	setSelectedUser: (user, targetViewState = 'profile') => set((state) => {
		const newUnreadMessages = new Map(state.unreadMessages);
		if (user) {
			newUnreadMessages.delete(user.clerkId);
		}
		const profileSource: 'chat' | 'discover' = targetViewState === 'chat' ? 'chat' : 'discover';
		return { selectedUser: user, unreadMessages: newUnreadMessages, viewState: targetViewState, profileSource };
	}),

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			const users = response.data;
			
			const newUnreadMessages = new Map(get().unreadMessages);
			users.forEach((user: any) => {
				if (user.unreadCount !== undefined) {
					if (user.unreadCount > 0) {
						newUnreadMessages.set(user.clerkId, user.unreadCount);
					} else {
						newUnreadMessages.delete(user.clerkId);
					}
				}
			});

			set({ users, unreadMessages: newUnreadMessages });
		} catch (error: any) {
			set({ error: error.response?.data?.message || error.message });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchRecommendations: async () => {
		try {
			const response = await axiosInstance.get("/users/recommendations?limit=10");
			set({ recommendations: response.data });
		} catch (error) {
			console.error("Failed to fetch recommendations", error);
		}
	},

	sendFriendRequest: async (userId: string) => {
		try {
			await axiosInstance.post(`/users/request/${userId}`);
			set((state) => ({
				users: state.users.map((u) => 
					u.clerkId === userId ? { ...u, isSent: true } : u
				)
			}));
		} catch (error) {
			console.error("Failed to send request", error);
		}
	},

	acceptFriendRequest: async (userId: string) => {
		try {
			await axiosInstance.post(`/users/accept/${userId}`);
			set((state) => ({
				users: state.users.map((u) => 
					u.clerkId === userId ? { ...u, isFriend: true, isPending: false } : u
				)
			}));
		} catch (error) {
			console.error("Failed to accept request", error);
		}
	},

	rejectFriendRequest: async (userId: string) => {
		try {
			await axiosInstance.post(`/users/reject/${userId}`);
			set((state) => ({
				users: state.users.map((u) => 
					u.clerkId === userId ? { ...u, isPending: false } : u
				)
			}));
		} catch (error) {
			console.error("Failed to reject request", error);
		}
	},

	removeFriend: async (userId: string) => {
		try {
			await axiosInstance.post(`/users/remove/${userId}`);
			set((state) => ({
				users: state.users.map((u) => 
					u.clerkId === userId ? { ...u, isFriend: false } : u
				),
				selectedUser: state.selectedUser?.clerkId === userId ? null : state.selectedUser
			}));
		} catch (error) {
			console.error("Failed to remove friend", error);
		}
	},

	updateProfile: async (formData: FormData) => {
		try {
			const res = await axiosInstance.put("/users/profile", formData, {
				headers: { "Content-Type": "multipart/form-data" }
			});
			// Update user in local list + selectedUser if viewing their profile
			set((state) => ({
				users: state.users.map((u) =>
					u.clerkId === res.data.clerkId ? { ...u, ...res.data } : u
				),
				// If we're currently viewing the updated user's profile, refresh it too
				selectedUser:
					state.selectedUser?.clerkId === res.data.clerkId
						? { ...state.selectedUser, ...res.data }
						: state.selectedUser,
			}));
			// Update current user in Auth Store
			useAuthStore.getState().updateCurrentUserProfile(res.data);
			// Re-fetch to ensure all other users see the fresh data from the server
			await get().fetchUsers();
		} catch (error) {
			console.error("Failed to update profile", error);
		}
	},

	getMutualFriends: async (userId: string) => {
		try {
			const res = await axiosInstance.get(`/users/profile/${userId}/mutual`);
			return res.data;
		} catch (error) {
			console.error("Failed to fetch mutual friends", error);
			return [];
		}
	},

	getUserFriends: async (userId: string) => {
		try {
			const res = await axiosInstance.get(`/users/profile/${userId}/friends`);
			return res.data;
		} catch (error) {
			console.error("Failed to fetch user friends", error);
			return [];
		}
	},

	initSocket: (userId) => {
		if (!get().isConnected) {
			socket.auth = { userId };
			
			socket.off("connect");
			socket.on("connect", () => {
				socket.emit("user_connected", userId);
			});

			socket.connect();
			
			if (socket.connected) {
				socket.emit("user_connected", userId);
			}

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

			socket.on("user_disconnected", (data: { userId: string, lastSeen: string, lastActivity?: string } | string) => {
				const disconnectedUserId = typeof data === "string" ? data : data.userId;
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.delete(disconnectedUserId);

					const lastSeenTime = typeof data === "string" ? new Date().toISOString() : data.lastSeen;
					const lastActivity = typeof data !== "string" ? data.lastActivity : undefined;

					const newUsers = state.users.map(u => 
						u.clerkId === disconnectedUserId ? { ...u, lastSeen: lastSeenTime, lastActivity: lastActivity || u.lastActivity } : u
					);

					const newActivities = new Map(state.userActivities);
					if (lastActivity && lastActivity !== "Offline" && lastActivity !== "Idle") {
						newActivities.set(disconnectedUserId, lastActivity);
					} else {
						newActivities.delete(disconnectedUserId);
					}

					const newSelectedUser = state.selectedUser?.clerkId === disconnectedUserId
						? { ...state.selectedUser, lastSeen: lastSeenTime, lastActivity: lastActivity || state.selectedUser.lastActivity }
						: state.selectedUser;

					return { onlineUsers: newOnlineUsers, users: newUsers, selectedUser: newSelectedUser, userActivities: newActivities };
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
						user.clerkId === message.senderId ? { ...user, lastMessage: message.content, lastMessageAt: message.createdAt } : user
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
						user.clerkId === message.receiverId ? { ...user, lastMessage: message.content, lastMessageAt: message.createdAt } : user
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

			socket.on("friend_request_received", (user: User) => {
				toast(`New friend request from ${user.fullName}`);
				get().fetchUsers();
			});

			socket.on("friend_request_accepted", (user: User) => {
				toast(`${user.fullName} accepted your friend request!`);
				get().fetchUsers();
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

	sendMessage: async (receiverId, senderId, content, replyToId, imageUrl, voiceNoteUrl) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("send_message", { receiverId, senderId, content, replyToId, imageUrl, voiceNoteUrl });
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
			set({ error: error.response?.data?.message || error.message });
		} finally {
			set({ isLoading: false });
		}
	},
}));