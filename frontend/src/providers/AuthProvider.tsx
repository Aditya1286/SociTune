import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

const updateApiToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
    }
    };

    const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { getToken, userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const {checkAdminStatus} = useAuthStore();
    const { initSocket, disconnectSocket } = useChatStore();
    const { fetchLikedSongs } = useMusicStore();

    useEffect(() => {
      const requestInterceptor = axiosInstance.interceptors.request.use(
        async (config) => {
          try {
            const token = await getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error("Error setting auth token in interceptor", error);
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      return () => {
        axiosInstance.interceptors.request.eject(requestInterceptor);
      };
    }, [getToken]);


  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getToken(); 
        updateApiToken(token);
        if(token) {
          await Promise.all([
            checkAdminStatus(),
            fetchLikedSongs()
          ]);
          // init socket
          if (userId) {
            initSocket(userId);
            // Fetch notifications and start listening
            const notifStore = useNotificationStore.getState();
            notifStore.fetchNotifications();
            notifStore.listenToNotifications(userId);
          }
        }
      } catch (error: any) {
        updateApiToken(null);
        console.log("Error in auth provider", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // clean up socket and listeners
    return () => {
      disconnectSocket();
      useNotificationStore.getState().stopListeningToNotifications();
    };
  }, [getToken, userId, initSocket, disconnectSocket]);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );

  return <div>{children}</div>;
};

export default AuthProvider;