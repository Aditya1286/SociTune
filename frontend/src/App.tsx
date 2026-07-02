import {Route,Routes, Navigate} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "./pages/home/HomePage.tsx"
import MainLayout from "./layout/MainLayout.tsx";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage.tsx"
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
import ChatPage from "./pages/chat/ChatPage.tsx";
import AlbumPage from "./pages/album/AlbumPage.tsx";
import NotFoundPage from "./pages/404/NotFoundPage.tsx";
import FounderPage from "./pages/founder/FounderPage.tsx";
import PremiumPage from "./pages/premium/PremiumPage.tsx";
import TimeTravelPage from "./pages/time-travel/TimeTravelPage.tsx";
import LikedSongsPage from "./pages/liked-songs/LikedSongsPage.tsx";
import MatchesPage from "./pages/matches/MatchesPage.tsx";
import NotificationsPage from "./pages/notifications/NotificationsPage.tsx";
import SearchPage from "./pages/search/SearchPage.tsx";
import ArtistPage from "./pages/artist/ArtistPage.tsx";

import { useChatStore } from "./stores/useChatStore.ts";
import { usePlayerStore } from "./stores/usePlayerStore.ts";
import { useEffect } from "react";
import { SearchCommand } from "./components/SearchCommand.tsx";
import SpotifyPlayerPage, { SpotifyCallback } from "./Features/SpotifyPlayer/components/SpotifyPlayer.tsx";
import LoginPage from "./pages/login/LoginPage.tsx";

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
      <Routes>
        <Route path='/sso-callback' 
          element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"}/>} 
        />
        <Route path='/auth-callback' element={<AuthCallbackPage/>} />
        <Route path='/login' element={<LoginPage />} />
        
        {/* We keep SpotifyCallback outside MainLayout, protected if necessary. */}
        <Route path='/callback' element={<ProtectedRoute><SpotifyCallback/></ProtectedRoute>} />
        
        <Route element={<MainLayout />}>
          <Route path='/' element={<HomePage/>} />
          <Route path='/search' element={<SearchPage/>} />
          
          <Route path='/chat' element={<ProtectedRoute><ChatPage/></ProtectedRoute>} />
          <Route path='/albums/:albumId' element={<ProtectedRoute><AlbumPage/></ProtectedRoute>} />
          <Route path='/founder' element={<ProtectedRoute><FounderPage/></ProtectedRoute>} />
          <Route path='/premium' element={<ProtectedRoute><PremiumPage/></ProtectedRoute>} />
          <Route path='/time-travel' element={<ProtectedRoute><TimeTravelPage/></ProtectedRoute>} />
          <Route path='/liked-songs' element={<ProtectedRoute><LikedSongsPage/></ProtectedRoute>} />
          <Route path='/matches' element={<ProtectedRoute><MatchesPage/></ProtectedRoute>} />
          <Route path='/notifications' element={<ProtectedRoute><NotificationsPage/></ProtectedRoute>} />
          <Route path='/artists/:artistName' element={<ProtectedRoute><ArtistPage/></ProtectedRoute>} />
          <Route path='/player' element={<ProtectedRoute><SpotifyPlayerPage/></ProtectedRoute>} />
          <Route path='*' element={<NotFoundPage/>} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
