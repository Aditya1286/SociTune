import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import type { User } from "@/types";

interface AuthStore {
	isAdmin: boolean;
	error: string | null;
	isLoading: boolean;
	currentUser: User | null;
	isAuthenticated: boolean;
	isLoaded: boolean;
	checkAdminStatus: () => Promise<void>;
	fetchCurrentUser: () => Promise<User | null>;
	login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
	signup: (email: string, password: string, fullName: string, username?: string) => Promise<{ success: boolean; message?: string }>;
	logout: () => void;
	updateCurrentUserProfile: (user: Partial<User>) => void;
	reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
	isAdmin: false,
	error: null,
	isLoading: false,
	currentUser: null,
	isAuthenticated: false,
	isLoaded: false,

	checkAdminStatus: async () => {
		try {
			const res = await axiosInstance.get("/admin/check");
			set({ isAdmin: res.data.admin });
		} catch (error) {
			set({ isAdmin: false });
		}
	},

	fetchCurrentUser: async () => {
		try {
			const res = await axiosInstance.get("/users/me");
			set({ currentUser: res.data, isAuthenticated: true, isLoaded: true });
			return res.data;
		} catch (error: any) {
			set({ currentUser: null, isAuthenticated: false, isLoaded: true });
			return null;
		}
	},

	login: async (email, password) => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.post("/auth/login", { email, password });
			const { token, user } = res.data;
			localStorage.setItem("access_token", token);
			set({ currentUser: user, isAuthenticated: true, isLoaded: true, error: null });
			return { success: true };
		} catch (error: any) {
			const message = error.response?.data?.message || "Invalid credentials";
			set({ error: message });
			return { success: false, message };
		} finally {
			set({ isLoading: false });
		}
	},

	signup: async (email, password, fullName, username) => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.post("/auth/signup", { email, password, fullName, username });
			const { token, user } = res.data;
			localStorage.setItem("access_token", token);
			set({ currentUser: user, isAuthenticated: true, isLoaded: true, error: null });
			return { success: true };
		} catch (error: any) {
			const message = error.response?.data?.message || "Failed to sign up";
			set({ error: message });
			return { success: false, message };
		} finally {
			set({ isLoading: false });
		}
	},

	logout: () => {
		localStorage.removeItem("access_token");
		set({ currentUser: null, isAuthenticated: false, isLoaded: true, isAdmin: false, error: null });
	},

	updateCurrentUserProfile: (updatedFields) => {
		set((state) => ({
			currentUser: state.currentUser ? { ...state.currentUser, ...updatedFields } : null,
		}));
	},

	reset: () => {
		set({ isAdmin: false, error: null, isLoading: false, currentUser: null, isAuthenticated: false, isLoaded: true });
	},
}));