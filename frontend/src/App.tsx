import {Route,Routes} from "react-router-dom";
import HomePage from "./pages/home/HomePage.tsx"
import MainLayout from "./layout/MainLayout.tsx";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage.tsx"
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import ChatPage from "./pages/chat/ChatPage.tsx";
import AlbumPage from "./pages/album/AlbumPage.tsx";
import AdminPage from "./pages/admin/AdminPage.tsx";
const App = () => {
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
      </Route>
    </Routes>
    </>
  )
}

export default App