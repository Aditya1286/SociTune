import React from "react";
import { useStore } from "../store/PlayerStore";
import { api } from "../api/services";
import { getStoredToken, redirectToSpotify } from "../api/Auth";
import {
  SidebarItem,
  GREEN,
} from "../atom/UI";
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  QueueIcon,
  SpotifyLogo,
} from "../atom/Icons";
import {
  HomeView,
  SearchView,
  LibraryView,
  PlaylistView,
  QueueView,
} from "./View";
import type { ViewId } from "../utils/types";
import NowPlayingPanel from "../atom/NowPlayingPanel";

export { SpotifyCallback } from "./SpotifyCallback";


// ─── Login screen ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0A0A0A",
      fontFamily: "Inter, sans-serif",
      gap: 32,
    }}
  >
    <div style={{ textAlign: "center" }}>
      <SpotifyLogo size={52} />
      <div
        style={{
          fontFamily: "DM Serif Display, serif",
          fontSize: 30,
          color: "#fff",
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        Your music, your way.
      </div>
      <div style={{ fontSize: 13, color: "#3a3a3a" }}>
        Connect Spotify to start listening.
      </div>
    </div>
    <button
      onClick={redirectToSpotify}
      style={{
        background: GREEN,
        color: "#000",
        border: "none",
        borderRadius: 4,
        padding: "12px 36px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        letterSpacing: "0.04em",
        fontFamily: "Inter, sans-serif",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) =>
        ((e.target as HTMLButtonElement).style.opacity = "0.8")
      }
      onMouseLeave={(e) =>
        ((e.target as HTMLButtonElement).style.opacity = "1")
      }
    >
      Connect with Spotify
    </button>
  </div>
);

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <HomeIcon size={14} /> },
  { id: "search", label: "Search", icon: <SearchIcon size={14} /> },
  { id: "library", label: "Library", icon: <LibraryIcon size={14} /> },
  { id: "queue", label: "Queue", icon: <QueueIcon size={14} /> },
];

// ─── Main player ──────────────────────────────────────────────────────────────

const SpotifyPlayer: React.FC = () => {
  const store = useStore();

  const switchView = (v: ViewId) => {
    store.setView(v);
    if (v === "queue") {
      api.getQueue().then((q) => store.setQueueItems(q?.queue ?? []));
    }
  };

  // ── Views map ──
  const views: Record<ViewId, React.ReactNode> = {
    home: <HomeView />,
    search: <SearchView />,
    library: <LibraryView />,
    playlist: <PlaylistView />,
    queue: <QueueView />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0A; overflow: hidden; }
        input::placeholder { color: #333; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 3px; background: #1e1e1e; border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #fff; cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#0A0A0A",
          fontFamily: "Inter, sans-serif",
          color: "#fff",
        }}
      >
        {/* ── Top bar ── */}
        <div
          style={{
            height: 50,
            borderBottom: "1px solid #0f0f0f",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SpotifyLogo size={18} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#e0e0e0",
              }}
            >
              Player
            </span>
          </div>
          {store.user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {store.user.images?.[0]?.url && (
                <img
                  src={store.user.images[0].url}
                  alt=""
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}
              <span style={{ fontSize: 11, color: "#3a3a3a" }}>
                {store.user.display_name}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          <div
            style={{
              width: 190,
              borderRight: "1px solid #0f0f0f",
              padding: "14px 8px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {NAV.map(({ id, label, icon }) => (
              <SidebarItem
                key={id}
                label={label}
                icon={icon}
                active={
                  store.view === id ||
                  (id === "library" && store.view === "playlist")
                }
                onClick={() => switchView(id)}
              />
            ))}
          </div>

          {/* Track list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
            {views[store.view]}
          </div>

          {/* Now playing panel */}
            <NowPlayingPanel/>
        </div>
      </div>
    </>
  );
};

// ─── Auth gate ────────────────────────────────────────────────────────────────

const SpotifyPlayerPage: React.FC = () => {
  const isAuthenticated = !!getStoredToken();
  return isAuthenticated ? <SpotifyPlayer /> : <LoginScreen />;
};

export default SpotifyPlayerPage;
