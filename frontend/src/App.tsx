import { Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import MainLayout from "./layout/MainLayout.tsx";
import { useAuth } from "@/lib/clerk-mock";
import NotFoundPage from "./pages/404/NotFoundPage.tsx";
import { useChatStore } from "./stores/useChatStore.ts";
import { usePlayerStore } from "./stores/usePlayerStore.ts";
import { SearchCommand } from "./components/SearchCommand.tsx";
import { SpotifyCallback } from "./Features/SpotifyPlayer/components/SpotifyPlayer.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";
import OnboardingPage from "./pages/onboarding/OnboardingPage.tsx";
import { layoutRoutes } from "./routes/routes.config.tsx";
import { useAuthStore } from "./stores/useAuthStore.ts";
import { Loader } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { currentUser, isLoading } = useAuthStore();
  const location = useLocation();

  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (currentUser && !currentUser.profileCompleted) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoading } = useAuthStore();

  if (!isLoaded || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const App = () => {
  const { userId } = useAuth();
  const { socket } = useChatStore();
  const { currentSong, isPlaying } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenEditProfile = () => {
      navigate("/onboarding");
    };
    document.addEventListener("open-edit-profile", handleOpenEditProfile);
    return () => document.removeEventListener("open-edit-profile", handleOpenEditProfile);
  }, [navigate]);

  useEffect(() => {
    if (socket && userId) {
      let activity = "Idle";
      if (isPlaying && currentSong) {
        activity = `Playing ${currentSong.title} by ${currentSong.artist}`;
      } else if (currentSong) {
        activity = `Paused ${currentSong.title} by ${currentSong.artist}`;
      }
      socket.emit("update_activity", { userId, activity });
    }
  }, [socket, userId, currentSong, isPlaying]);

  return (
    <>
      <SearchCommand />
      <Toaster theme="dark" position="top-center" />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
          <Route path="/callback" element={<ProtectedRoute><SpotifyCallback /></ProtectedRoute>} />

          <Route element={<MainLayout />}>
            {layoutRoutes.map(({ path, element, protected: isProtected }) => (
              <Route
                key={path}
                path={path}
                element={isProtected ? <ProtectedRoute>{element}</ProtectedRoute> : element}
              />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App;