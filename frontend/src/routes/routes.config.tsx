// routes.config.tsx
import { lazy } from "react";
import type { ReactNode } from "react";

const HomePage = lazy(() => import("../pages/home/HomePage.tsx"));
const ChatPage = lazy(() => import("../pages/chat/ChatPage.tsx"));
const AlbumPage = lazy(() => import("../pages/album/AlbumPage.tsx"));
const FounderPage = lazy(() => import("../pages/founder/FounderPage.tsx"));
const PremiumPage = lazy(() => import("../pages/premium/PremiumPage.tsx"));
const TimeTravelPage = lazy(() => import("../pages/time-travel/TimeTravelPage.tsx"));
const LikedSongsPage = lazy(() => import("../pages/liked-songs/LikedSongsPage.tsx"));
const MatchesPage = lazy(() => import("../pages/matches/MatchesPage.tsx"));
const NotificationsPage = lazy(() => import("../pages/notifications/NotificationsPage.tsx"));
const SearchPage = lazy(() => import("../pages/search/SearchPage.tsx"));
const ArtistPage = lazy(() => import("../pages/artist/ArtistPage.tsx"));
const SpotifyPlayerPage = lazy(() => import("../Features/SpotifyPlayer/components/SpotifyPlayer.tsx"));

export interface AppRoute {
  path: string;
  element: ReactNode;
  protected?: boolean; // defaults to false
}

// Routes rendered inside MainLayout
export const layoutRoutes: AppRoute[] = [
  { path: "/", element: <HomePage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/chat", element: <ChatPage />, protected: true },
  { path: "/albums/:albumId", element: <AlbumPage />, protected: true },
  { path: "/founder", element: <FounderPage />, protected: true },
  { path: "/premium", element: <PremiumPage />, protected: true },
  { path: "/time-travel", element: <TimeTravelPage />, protected: true },
  { path: "/liked-songs", element: <LikedSongsPage />, protected: true },
  { path: "/matches", element: <MatchesPage />, protected: true },
  { path: "/notifications", element: <NotificationsPage />, protected: true },
  { path: "/artists/:artistName", element: <ArtistPage />, protected: true },
  { path: "/player", element: <SpotifyPlayerPage />, protected: true },
];