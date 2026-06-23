import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { Notification } from "@/types";
import { io } from "socket.io-client";
import { toast } from "sonner";

const socificationURL = import.meta.env.VITE_SOCIFICATION_URL || "https://socification.onrender.com";

const notificationSocket = io(socificationURL, {
	autoConnect: false,
	withCredentials: true,
});

interface NotificationStore {
	notifications: Notification[];
	unreadCount: number;
	isLoading: boolean;
	error: string | null;
	isListening: boolean;

	fetchNotifications: () => Promise<void>;
	markAllAsRead: () => Promise<void>;
	markAsRead: (id: string) => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
	listenToNotifications: (userId: string) => void;
	stopListeningToNotifications: () => void;
	addLocalNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
	notifications: [],
	unreadCount: 0,
	isLoading: false,
	error: null,
	isListening: false,

	fetchNotifications: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/notifications");
			const notifications = res.data;
			const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
			set({ notifications, unreadCount });
		} catch (error: any) {
			set({ error: error.response?.data?.message || error.message });
		} finally {
			set({ isLoading: false });
		}
	},

	markAllAsRead: async () => {
		try {
			await axiosInstance.put("/notifications/read-all");
			set((state) => ({
				notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
				unreadCount: 0
			}));
			toast.success("All notifications marked as read");
		} catch (error: any) {
			console.error("Failed to mark notifications as read", error);
		}
	},

	markAsRead: async (id) => {
		try {
			await axiosInstance.put(`/notifications/${id}/read`);
			set((state) => {
				const notifications = state.notifications.map((n) => 
					n._id === id ? { ...n, isRead: true } : n
				);
				const unreadCount = notifications.filter((n) => !n.isRead).length;
				return { notifications, unreadCount };
			});
		} catch (error: any) {
			console.error("Failed to mark notification as read", error);
		}
	},

	deleteNotification: async (id) => {
		try {
			await axiosInstance.delete(`/notifications/${id}`);
			set((state) => {
				const notifications = state.notifications.filter((n) => n._id !== id);
				const unreadCount = notifications.filter((n) => !n.isRead).length;
				return { notifications, unreadCount };
			});
		} catch (error: any) {
			console.error("Failed to delete notification", error);
		}
	},

	addLocalNotification: (notification) => {
		set((state) => {
			const existingIndex = state.notifications.findIndex((n) => n._id === notification._id);
			let updatedNotifications = [...state.notifications];

			if (existingIndex !== -1) {
				// Remove the old one
				updatedNotifications.splice(existingIndex, 1);
			}

			// Add the new/updated one to the beginning
			updatedNotifications = [notification, ...updatedNotifications];

			const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;
			return { notifications: updatedNotifications, unreadCount };
		});
	},

	listenToNotifications: (userId: string) => {
		if (get().isListening) return;

		notificationSocket.auth = { userId };
		
		notificationSocket.off("connect");
		notificationSocket.on("connect", () => {
			notificationSocket.emit("user_connected", userId);
		});

		notificationSocket.connect();

		const socket = notificationSocket;
		if (!socket) return;

		// New event structure support
		socket.on("notification:new", (data: { notification: Notification; unreadCount: number }) => {
			get().addLocalNotification(data.notification);
			set({ unreadCount: data.unreadCount });

			// Sound feedback
			try {
				const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
				audio.volume = 0.2;
				audio.play().catch(() => {});
			} catch (e) {}

			toast(data.notification.title, {
				description: data.notification.message,
				action: {
					label: "View",
					onClick: () => {
						window.location.href = "/notifications";
					}
				}
			});
		});

		socket.on("notification:read", (data: { notificationId: string; unreadCount: number }) => {
			set((state) => ({
				notifications: state.notifications.map((n) => 
					n._id === data.notificationId ? { ...n, isRead: true } : n
				),
				unreadCount: data.unreadCount
			}));
		});

		socket.on("notification:deleted", (data: { notificationId: string; unreadCount: number }) => {
			set((state) => ({
				notifications: state.notifications.filter((n) => n._id !== data.notificationId),
				unreadCount: data.unreadCount
			}));
		});

		socket.on("notification:count-updated", (data: { unreadCount: number }) => {
			set({ unreadCount: data.unreadCount });
		});

		// Legacy event support fallback
		socket.on("new_notification", (notification: Notification) => {
			get().addLocalNotification(notification);

			// Sound feedback
			try {
				const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
				audio.volume = 0.2;
				audio.play().catch(() => {});
			} catch (e) {}

			toast(notification.title, {
				description: notification.message,
				action: {
					label: "View",
					onClick: () => {
						window.location.href = "/notifications";
					}
				}
			});
		});

		set({ isListening: true });
	},

	stopListeningToNotifications: () => {
		if (notificationSocket) {
			notificationSocket.off("new_notification");
			notificationSocket.off("notification:new");
			notificationSocket.off("notification:read");
			notificationSocket.off("notification:deleted");
			notificationSocket.off("notification:count-updated");
			notificationSocket.disconnect();
		}
		set({ isListening: false });
	}
}));
