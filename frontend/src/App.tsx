import {Route,Routes} from "react-router-dom";
import HomePage from "./pages/home/HomePage.tsx"
import MainLayout from "./layout/MainLayout.tsx";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage.tsx"
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
import ChatPage from "./pages/chat/ChatPage.tsx";
import AlbumPage from "./pages/album/AlbumPage.tsx";
import AdminPage from "./pages/admin/AdminPage.tsx";
import NotFoundPage from "./pages/404/NotFoundPage.tsx";
import { useChatStore } from "./stores/useChatStore.ts";
import { usePlayerStore } from "./stores/usePlayerStore.ts";
import { useEffect } from "react";

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
        <Route path='*' element={<NotFoundPage/>} />
      </Route>
    </Routes>
    </>
  )
}

export default App