import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const { checkAdminStatus, fetchCurrentUser } = useAuthStore();
  const { initSocket, disconnectSocket } = useChatStore();
  const { fetchLikedSongs } = useMusicStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          await Promise.all([
            checkAdminStatus(),
            fetchLikedSongs()
          ]);
          
          initSocket(user.clerkId);
          
          const notifStore = useNotificationStore.getState();
          notifStore.fetchNotifications();
          notifStore.listenToNotifications(user.clerkId);
        }
      } catch (error: any) {
        console.log("Error in auth provider", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      disconnectSocket();
      useNotificationStore.getState().stopListeningToNotifications();
    };
  }, [fetchCurrentUser, checkAdminStatus, fetchLikedSongs, initSocket, disconnectSocket]);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );

  return <div>{children}</div>;
};

export default AuthProvider;