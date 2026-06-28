import {create} from "zustand";

interface AuthStore {
    isAdmin: boolean;
    error: string | null;
    isLoading: boolean;

    checkAdminStatus: () => Promise<void>;
    reset: () => void;
}

export const useAuthStore = create<AuthStore>((set)=>({
    isAdmin: true,
    isLoading: false,
    error: null,
    checkAdminStatus: async () => {
        set({ isAdmin: true , isLoading: false, error: null }); //Fucker no backend check for admin
    },
    reset: () => {
        set({ isAdmin: false, isLoading: false, error: null });
    }
}))