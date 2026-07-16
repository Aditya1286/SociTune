import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store/PlayerStore";
import { getStoredToken, getValidToken, redirectToSpotify, clearTokens } from "../services/Auth";
import { SpotifyLogo } from "../atom/Icons";
import {
  HomeView,
  SearchView,
  LibraryView,
  PlaylistView,
  QueueView,
} from "./View";
import type { ViewId, WebPlaybackState, WebPlaybackTrack } from "../utils/types";
import NowPlayingPanel from "../atom/NowPlayingPanel";
import { Home, Search, Library, Disc, LogOut, LayoutList, Music, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../services/spotifyApi";
import { useMutation } from "@tanstack/react-query";
import { saveSongEvent } from "../services/SongEvent/songEvent.service";
import type { songEventPayload } from "../services/SongEvent/types";

export { SpotifyCallback } from "./SpotifyCallback";

const REPEAT_CYCLE: ("off" | "context" | "track")[] = ["off", "context", "track"];
const CONFIRM_PLAY_MS = 5000;
const COMPLETED_THRESHOLD = 0.9;
const FAILED_QUEUE_KEY = "song_event_failed_queue";

type SongSession = {
  sessionId: string;
  trackId: string;
  track: WebPlaybackTrack;
  duration: number;
  startedAt: string;
  maxPositionReached: number;
};

const fmtTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const buildPayload = (session: SongSession, completed: boolean): songEventPayload => ({
  song_details: {
    title: session.track.name,
    artist: session.track.artists.map((a: any) => a.name).join(", "),
    external_ids: {
      spotify_id: session.track.id,
    },
    genre_primary: "unknown",
    duration: fmtTime(session.duration),
    image_url: session.track?.album?.images?.[0]?.url ?? "",
  },
  played_at: session.startedAt,
  duration_ms: String(session.maxPositionReached),
  completed,
  session_id: session.sessionId,
  source: "organic",
});

const readFailedQueue = (): songEventPayload[] => {
  try {
    return JSON.parse(localStorage.getItem(FAILED_QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const writeFailedQueue = (queue: songEventPayload[]) => {
  try {
    localStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
};


// ─── Login screen ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => (
  <div className="relative min-h-[calc(100vh-140px)] w-full overflow-y-auto bg-gradient-to-b from-[#121214] to-[#090909] flex flex-col p-6 sm:p-16 select-none rounded-[28px] border border-white/5 shadow-2xl items-center justify-center">
    {/* Subtle Ambient Background glow */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#1ED760]/[0.015] rounded-full blur-[130px] pointer-events-none" />

    <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-10 py-4">
      
      {/* 1. Header / Branding / Spotify Logo */}
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="p-3.5 bg-[#111111] border border-white/5 text-[#1ED760] rounded-[20px] shadow-lg shadow-black/50"
        >
          <SpotifyLogo size={28} />
        </motion.div>
        
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#1ED760] tracking-[0.2em] uppercase">
            Spotify Integration
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Import Your Music Taste
          </h1>
        </div>
      </div>

      {/* 2. Short description */}
      <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-sm">
        Connect your Spotify account so we can build your Audio DNA, discover musical compatibility, and personalize every interaction.
      </p>

      {/* 3. Connect Button */}
      <div className="w-full max-w-[420px]">
        <button
          onClick={redirectToSpotify}
          className="w-full bg-[#1ED760] hover:bg-[#1ED760]/95 text-black font-semibold text-xs h-[54px] rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(30,215,96,0.12)] hover:shadow-[0_4px_25px_rgba(30,215,96,0.22)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <SpotifyLogo size={18} />
          <span>Continue with Spotify</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-white/5" />

      {/* 4. Elegant Cards Grid */}
      <div className="w-full space-y-3 text-left">
        <div className="grid grid-cols-1 gap-2.5">
          {/* Card 1 */}
          <div className="bg-[#171717] border border-white/5 p-4 rounded-[20px] flex gap-3.5 items-start transition-all duration-300 hover:border-white/10 group">
            <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[#A1A1AA] group-hover:text-white transition-colors">
              <Music className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-white">Your Audio DNA</h4>
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                We analyze your musical fingerprint.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#171717] border border-white/5 p-4 rounded-[20px] flex gap-3.5 items-start transition-all duration-300 hover:border-white/10 group">
            <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[#A1A1AA] group-hover:text-white transition-colors">
              <Heart className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-white">Soulmate Matching</h4>
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                Find people with remarkably similar taste.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#171717] border border-white/5 p-4 rounded-[20px] flex gap-3.5 items-start transition-all duration-300 hover:border-white/10 group">
            <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[#A1A1AA] group-hover:text-white transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-white">Privacy First</h4>
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                Only listening data is accessed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-white/5" />

      {/* 5. Privacy Section */}
      <div className="flex gap-2 items-center justify-center text-center max-w-sm">
        <p className="text-[10px] text-[#A1A1AA]/60 leading-relaxed">
          Your privacy comes first. We only request access to your listening preferences. Passwords and payment information are never shared.
        </p>
      </div>
    </div>
  </div>
);

// ─── Main player ──────────────────────────────────────────────────────────────

const SpotifyPlayer: React.FC = () => {
  const store = useStore();
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(true);
  const positionTimer = useRef<ReturnType<typeof setInterval>>(0);

  const sessionRef = useRef<SongSession | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout>>(0);

  const { mutate: sendSongEvent } = useMutation({
    mutationFn: saveSongEvent,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    onError: (err, payload) => {
      console.error("song-event failed after retries, queueing for later", err);
      const queue = readFailedQueue();
      queue.push(payload);
      writeFailedQueue(queue);
    },
  });

  const finalizeSession = (session: SongSession) => {
    const completed =
      session.duration > 0 && session.maxPositionReached / session.duration >= COMPLETED_THRESHOLD;
    sendSongEvent(buildPayload(session, completed));
  };

  const pollState = async () => {
    try {
      const data = (await api.player()) as any;
      if (!data || !data.item) return;

      if (store.deviceId && data.device?.id === store.deviceId) {
        return;
      }

      const item = data.item;
      const track = {
        id: item.id,
        name: item.name,
        uri: item.uri,
        album: {
          uri: item.album.uri,
          name: item.album.name,
          images: item.album.images,
        },
        artists: item.artists,
        type: "track",
        media_type: "audio",
        is_playable: true,
      };

      store.setPlaybackState({
        track,
        isPlaying: data.is_playing,
        position: data.progress_ms,
        duration: item.duration_ms,
        shuffle: data.shuffle_state,
        repeat:
          data.repeat_state === "track"
            ? "track"
            : data.repeat_state === "context"
              ? "context"
              : "off",
      });

      import("@/stores/usePlayerStore").then(({ usePlayerStore }) => {
        const localState = usePlayerStore.getState();
        const spotifySong = {
          _id: item.id,
          title: item.name,
          artist: item.artists.map((a: any) => a.name).join(", "),
          imageUrl: item.album.images[0]?.url || "",
          audioUrl: `spotify:track:${item.id}`,
          duration: item.duration_ms / 1000,
          albumId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          external_ids: {
            spotify_id: item.id,
            fuzzy_id: ""
          }
        };

        if (localState.currentSong?.external_ids?.spotify_id !== item.id) {
          usePlayerStore.setState({
            currentSong: spotifySong,
            isPlaying: data.is_playing
          });
        } else if (localState.isPlaying !== data.is_playing) {
          usePlayerStore.setState({
            isPlaying: data.is_playing
          });
        }
      });
    } catch (e) {}
  };

  useEffect(() => {
    const flush = () => {
      const queue = readFailedQueue();
      if (!queue.length) return;
      writeFailedQueue([]);
      queue.forEach((payload) => sendSongEvent(payload));
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  useEffect(() => {
    const track = store.track;
    if (!track?.id) return;

    if (sessionRef.current && sessionRef.current.trackId !== track.id) {
      finalizeSession(sessionRef.current);
      sessionRef.current = null;
    }

    clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      if (store.track?.id !== track.id) return;
      sessionRef.current = {
        sessionId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        trackId: track.id,
        track,
        duration: store.duration,
        startedAt: new Date().toISOString(),
        maxPositionReached: store.position,
      };
    }, CONFIRM_PLAY_MS);

    return () => clearTimeout(confirmTimerRef.current);
  }, [store.track?.id]);

  useEffect(() => {
    if (sessionRef.current && sessionRef.current.trackId === store.track?.id) {
      sessionRef.current.maxPositionReached = Math.max(
        sessionRef.current.maxPositionReached,
        store.position
      );
      sessionRef.current.duration = store.duration;
    }
  }, [store.position, store.track?.id, store.duration]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) finalizeSession(sessionRef.current);
    };
  }, []);

  useEffect(() => {
    if (document.getElementById("spotify-sdk")) return;
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: "SociTune Player",
        getOAuthToken: async (cb) => {
          const t = await getValidToken();
          if (t) cb(t);
        },
        volume: store.volume / 100,
      });

      player.addListener("ready", async (data) => {
        const { device_id } = data as { device_id: string };

        store.setDeviceId(device_id);
        store.setPlayer(player);

        await api.transferPlayback(device_id);
      });

      player.addListener("player_state_changed", (raw: unknown) => {
        const state = raw as WebPlaybackState | null;
        if (!state) return;

        const isSpotifyPlaying = !state.paused;
        if (isSpotifyPlaying) {
          import("@/stores/usePlayerStore").then(({ usePlayerStore }) => {
            const localState = usePlayerStore.getState();
            if (localState.isPlaying) {
              usePlayerStore.setState({ isPlaying: false });
            }
          });
        }

        const track = state.track_window.current_track;
        const repeat = REPEAT_CYCLE[state.repeat_mode] ?? "off";

        store.setPlaybackState({
          track,
          isPlaying: isSpotifyPlaying,
          position: state.position,
          duration: state.duration,
          shuffle: state.shuffle,
          repeat,
        });

        if (track) {
          import("@/stores/usePlayerStore").then(({ usePlayerStore }) => {
            const localState = usePlayerStore.getState();
            const spotifySong = {
              _id: track.id,
              title: track.name,
              artist: track.artists.map(a => a.name).join(", "),
              imageUrl: track.album.images[0]?.url || "",
              audioUrl: `spotify:track:${track.id}`,
              duration: state.duration / 1000,
              albumId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              external_ids: {
                spotify_id: track.id,
                fuzzy_id: ""
              }
            };
            
            if (localState.currentSong?.external_ids?.spotify_id !== track.id) {
              usePlayerStore.setState({
                currentSong: spotifySong,
                isPlaying: isSpotifyPlaying
              });
            } else if (localState.isPlaying !== isSpotifyPlaying) {
              usePlayerStore.setState({
                isPlaying: isSpotifyPlaying
              });
            }
          });
        }
      });
      player.connect();
    };

    window.onSpotifyWebPlaybackSDKReady = initPlayer;
    if (window.Spotify) initPlayer();

    api.me().then((u) => {
      if (u) store.setUser(u);
    });
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    pollState();
    const interval = setInterval(pollState, 4000);
    return () => {
      clearInterval(interval);
    };
  }, [store.deviceId]);

  useEffect(() => {
    if (!store.track?.id) return;

    api
      .isTrackLiked([store.track.id])
      .then((res) => {
        if (res && res.length > 0) {
          store.setIsLiked(res[0]);
        }
      })
      .catch((e) => console.error("Error checking Spotify like state:", e));
  }, [store.track?.id]);

  useEffect(() => {
    clearInterval(positionTimer.current);
    if (store.isPlaying) {
      positionTimer.current = setInterval(() => {
        store.setPosition(Math.min(store.position + 1000, store.duration));
      }, 1000);
    }
    return () => clearInterval(positionTimer.current);
  }, [store.isPlaying, store.position, store.duration]);

  const switchView = (v: ViewId) => {
    store.setView(v);
  };

  const handleLogout = () => {
    clearTokens();
    window.location.href = "/player";
  };

  const navItems: { id: ViewId; label: string; icon: any }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "library", label: "Library", icon: Library },
    { id: "queue", label: "Queue", icon: LayoutList },
  ];

  const views: Record<ViewId, React.ReactNode> = {
    home: <HomeView />,
    search: <SearchView />,
    library: <LibraryView />,
    playlist: <PlaylistView />,
    queue: <QueueView />,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full overflow-hidden bg-black/40 rounded-3xl border border-white/5 shadow-2xl relative">
      {/* Ambient background blur */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header tab bar */}
      <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-zinc-950/20 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="text-emerald-400 relative">
              <SpotifyLogo size={20} />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight uppercase">
              Spotify Sync
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const active = store.view === item.id || (item.id === "library" && store.view === "playlist");
              return (
                <button
                  key={item.id}
                  onClick={() => switchView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                    active
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls & User Info */}
        <div className="flex items-center gap-4">
          {store.user && (
            <div className="hidden md:flex items-center gap-2.5 bg-white/[0.02] border border-white/5 pl-2.5 pr-3.5 py-1 rounded-full text-xs font-medium text-zinc-300">
              {store.user.images?.[0]?.url ? (
                <img
                  src={store.user.images[0].url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">
                  {store.user.display_name?.charAt(0) || "U"}
                </div>
              )}
              <span>{store.user.display_name}</span>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)}
            title="Toggle details panel"
            className={`p-2 rounded-xl border border-white/5 transition-all duration-300 ${
              isNowPlayingOpen
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            <Disc className="size-4 animate-spin-slow" />
          </button>

          <button
            onClick={handleLogout}
            title="Logout from Spotify"
            className="p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main body content area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Track views */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          {views[store.view]}
        </main>

        {/* Right side Now Playing panel */}
        {isNowPlayingOpen && (
          <aside className="w-68 border-l border-white/5 flex-shrink-0 bg-zinc-950/10 backdrop-blur-md overflow-y-auto">
            <NowPlayingPanel />
          </aside>
        )}
      </div>
    </div>
  );
};

// ─── Auth gate ────────────────────────────────────────────────────────────────

const SpotifyPlayerPage: React.FC = () => {
  const isAuthenticated = !!getStoredToken();
  return isAuthenticated ? <SpotifyPlayer /> : <LoginScreen />;
};

export default SpotifyPlayerPage;
