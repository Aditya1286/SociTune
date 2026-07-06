import { Route, Routes, Navigate } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import MainLayout from "./layout/MainLayout.tsx";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage.tsx";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
import NotFoundPage from "./pages/404/NotFoundPage.tsx";
import { useChatStore } from "./stores/useChatStore.ts";
import { usePlayerStore } from "./stores/usePlayerStore.ts";
import { SearchCommand } from "./components/SearchCommand.tsx";
import { SpotifyCallback } from "./Features/SpotifyPlayer/components/SpotifyPlayer.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";
import { layoutRoutes } from "./routes/routes.config.tsx";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  const { userId } = useAuth();
  const { socket } = useChatStore();
  const { currentSong, isPlaying } = usePlayerStore();

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
          <Route
            path="/sso-callback"
            element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
          />
          <Route path="/auth-callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<LoginPage />} />

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