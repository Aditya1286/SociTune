import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { User } from "@/types";

interface AuthStore {
    isAdmin: boolean;
    error: string | null;
    isLoading: boolean;
    isLoaded: boolean;
    isSignedIn: boolean;
    currentUser: User | null;

    checkAdminStatus: () => Promise<void>;
    fetchCurrentUser: () => Promise<User | null>;
    login: (email: string, password: String) => Promise<User | null>;
    register: (email: string, password: string, fullName: string, username?: string) => Promise<User | null>;
    googleLogin: (credential: string) => Promise<User | null>;
    logout: () => Promise<void>;
    updateCurrentUserProfile: (user: Partial<User>) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isAdmin: false,
    isLoading: false,
    isLoaded: false,
    isSignedIn: false,
    error: null,
    currentUser: null,
    
    checkAdminStatus: async () => {
        set({ isLoading: true, error: null });
        try {
            // Check if user is admin based on admin check route or checking user object
            const state = useAuthStore.getState();
            if (state.currentUser?.email) {
                // If needed, check if the email matches ADMIN_EMAIL or just assume from fetch
                set({ isAdmin: true });
            }
        } catch (error) {
            set({ isAdmin: false });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/users/me");
            const user = response.data;
            set({ currentUser: user, isSignedIn: true, isLoaded: true });
            return user;
        } catch (error: any) {
            set({ currentUser: null, isSignedIn: false, isLoaded: true });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post("/auth/login", { email, password });
            const user = response.data.user;
            set({ currentUser: user, isSignedIn: true, isLoaded: true });
            return user;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Invalid email or password";
            set({ error: errorMsg });
            throw new Error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (email, password, fullName, username) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post("/auth/register", { email, password, fullName, username });
            const user = response.data.user;
            set({ currentUser: user, isSignedIn: true, isLoaded: true });
            return user;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Registration failed";
            set({ error: errorMsg });
            throw new Error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    googleLogin: async (credential) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.post("/auth/google", { credential });
            const user = response.data.user;
            set({ currentUser: user, isSignedIn: true, isLoaded: true });
            return user;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Google authentication failed";
            set({ error: errorMsg });
            throw new Error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await axiosInstance.post("/auth/logout");
            set({ currentUser: null, isSignedIn: false, isAdmin: false });
        } catch (error: any) {
            console.error("Error logging out:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateCurrentUserProfile: (userData: Partial<User>) => {
        set((state) => {
            if (!state.currentUser) return state;
            return {
                currentUser: {
                    ...state.currentUser,
                    ...userData,
                }
            };
        });
    },

    reset: () => {
        set({ isAdmin: false, isLoading: false, isLoaded: false, isSignedIn: false, error: null, currentUser: null });
    }
}));