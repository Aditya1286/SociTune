import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { User } from "@/types";

interface AuthStore {
    isAdmin: boolean;
    error: string | null;
    isLoading: boolean;
    currentUser: User | null;

    checkAdminStatus: () => Promise<void>;
    fetchCurrentUser: () => Promise<User | null>;
    updateCurrentUserProfile: (user: Partial<User>) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isAdmin: true,
    isLoading: false,
    error: null,
    currentUser: null,
    
    checkAdminStatus: async () => {
        set({ isAdmin: true, isLoading: false, error: null });
    },

    fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/users/me");
            const user = response.data;
            set({ currentUser: user });
            return user;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            set({ error: errorMsg, currentUser: null });
            return null;
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
        set({ isAdmin: false, isLoading: false, error: null, currentUser: null });
    }
}));