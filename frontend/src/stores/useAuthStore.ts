import {create} from "zustand";

interface AuthStore {
    isAdmin: boolean;
    error: string | null;
    isLoading: boolean;

    checkAdminStatus: () => Promise<void>;
    reset: () => void;
}

export const useAuthStore = create<AuthStore>((set)=>({
    isAdmin: false,
    isLoading: false,
    error: null,
    checkAdminStatus: async () => {
        set({ isAdmin: false, isLoading: false, error: null });
    },
    reset: () => {
        set({ isAdmin: false, isLoading: false, error: null });
    }
}))