import {Route,Routes} from "react-router-dom";
import HomePage from "./pages/home/HomePage.tsx"
import MainLayout from "./layout/MainLayout.tsx";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage.tsx"
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
import ChatPage from "./pages/chat/ChatPage.tsx";
import AlbumPage from "./pages/album/AlbumPage.tsx";
import AdminPage from "./pages/admin/AdminPage.tsx";
import NotFoundPage from "./pages/404/NotFoundPage.tsx";
import FounderPage from "./pages/founder/FounderPage.tsx";
import PremiumPage from "./pages/premium/PremiumPage.tsx";
import TimeTravelPage from "./pages/time-travel/TimeTravelPage.tsx";
import LikedSongsPage from "./pages/liked-songs/LikedSongsPage.tsx";
import MatchesPage from "./pages/matches/MatchesPage.tsx";
import { useChatStore } from "./stores/useChatStore.ts";
import { usePlayerStore } from "./stores/usePlayerStore.ts";
import { useEffect } from "react";
import { SearchCommand } from "./components/SearchCommand.tsx";

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
    <Routes>
      
      <Route path='/sso-callback' 
      element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"}/>} 
      />
       <Route path='/admin' element={<AdminPage />} />
      <Route path='/auth-callback' element={<AuthCallbackPage/>} />
      <Route element={<MainLayout />}>
        <Route path='/' element={<HomePage/>} />
        <Route path='/chat' element={<ChatPage/>} />
        <Route path='/albums/:albumId' element={<AlbumPage/>} />
        <Route path='/founder' element={<FounderPage/>} />
        <Route path='/premium' element={<PremiumPage/>} />
        <Route path='/time-travel' element={<TimeTravelPage/>} />
        <Route path='/liked-songs' element={<LikedSongsPage/>} />
        <Route path='/matches' element={<MatchesPage/>} />
        <Route path='*' element={<NotFoundPage/>} />
      </Route>
    </Routes>
    </>
  )
}

export default App