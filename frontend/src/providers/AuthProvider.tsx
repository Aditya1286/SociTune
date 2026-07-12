import { useAuth } from "@/lib/clerk-mock";
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const { checkAdminStatus } = useAuthStore();
  const { initSocket, disconnectSocket } = useChatStore();
  const { fetchLikedSongs } = useMusicStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          const user = await useAuthStore.getState().fetchCurrentUser();
          if (user) {
            await Promise.all([
              checkAdminStatus(),
              fetchLikedSongs(),
            ]);
            initSocket(user.clerkId);
            const notifStore = useNotificationStore.getState();
            await notifStore.fetchNotifications();
            notifStore.listenToNotifications(user.clerkId);
          }
        } else {
          useAuthStore.getState().reset();
        }
      } catch (error: any) {
        console.error("Error in auth provider", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      disconnectSocket();
      useNotificationStore.getState().stopListeningToNotifications();
    };
  }, [isSignedIn, initSocket, disconnectSocket]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;