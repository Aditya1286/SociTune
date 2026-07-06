import { useEffect, useRef } from "react";
import { AlbumArt, ProgressBar, fmt } from "./UI";
import { useStore } from "../Index";
import { getStoredToken, getValidToken } from "../services/Auth";
import type { RepeatMode, WebPlaybackState, WebPlaybackTrack } from "../Index";
import { api } from "../services/spotifyApi";
import { useMusicStore } from "@/stores/useMusicStore";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart, 
  Laptop2
} from "lucide-react";
import type { songEventPayload } from "../services/SongEvent/types";
import { saveSongEvent } from "../services/SongEvent/songEvent.service";
import { useMutation } from "@tanstack/react-query";

const REPEAT_CYCLE: RepeatMode[] = ["off", "context", "track"];
const CONFIRM_PLAY_MS = 5000; // ignore skips shorter than this
const COMPLETED_THRESHOLD = 0.9; // 90% listened = "completed"
const FAILED_QUEUE_KEY = "song_event_failed_queue";



type SongSession = {

  sessionId: string;
  trackId: string;
  track: WebPlaybackTrack; // whatever type store.track is
  duration: number;
  startedAt: string;
  maxPositionReached: number;
};

const buildPayload = (
  session: SongSession,
  completed: boolean
): songEventPayload=> ({
  song_details: {
    title: session.track.name,
    artist: fmt.artists(session.track.artists),
    external_ids: {
      spotify_id: session.track.id,
      fuzzy_id: `${session.track.name}-${fmt.artists(session.track.artists)}`,
    },
    primary_genre: "", // TODO: fill once genre lookup is wired in
    duration: fmt.time(session.duration),
    image_url: session.track?.album?.images?.[0]?.url ?? "",
  },
  played_at: session.startedAt,
  duration_ms: String(session.maxPositionReached),
  completed,
  session_id: session.sessionId,
  source: "organic", // TODO: derive from nav context (search/playlist/radio) later
});

// ── Offline-safe queue helpers ──────────────────────────────────────
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
  } catch {
    // storage full / unavailable — drop silently, this is best-effort telemetry
  }
};
const NowPlayingPanel = () => {

    const store = useStore();
  const { likedSongs, toggleLikeSong, fetchLikedSongs } = useMusicStore();
  const positionTimer = useRef<ReturnType<typeof setInterval>>(0);

  const sessionRef = useRef<SongSession | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout>>(0);

  const { mutate: sendSongEvent } = useMutation({
    mutationFn: saveSongEvent,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // 1s, 2s, 4s cap 10s
    onError: (err, payload) => {
      console.error("song-event failed after retries, queueing for later", err);
      const queue = readFailedQueue();
      queue.push(payload);
      writeFailedQueue(queue);
    },
  });

  // ── Flush any failed events from a previous session on mount / reconnect ──
  useEffect(() => {
    const flush = () => {
      const queue = readFailedQueue();
      if (!queue.length) return;
      writeFailedQueue([]); // clear optimistically; failures re-queue themselves
      queue.forEach((payload) => sendSongEvent(payload));
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalizeSession = (session: SongSession) => {
    const completed =
      session.duration > 0 &&
      session.maxPositionReached / session.duration >= COMPLETED_THRESHOLD;
    sendSongEvent(buildPayload(session, completed));
  };

  // ── Track change detection: confirm play after threshold, finalize previous ──
  useEffect(() => {
    const track = store.track;
    if (!track?.id) return;

    // If this is genuinely a new track, finalize the outgoing session immediately
    if (sessionRef.current && sessionRef.current.trackId !== track.id) {
      finalizeSession(sessionRef.current);
      sessionRef.current = null;
    }

    clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      // Only start a session if still on the same track and actually playing
      if (store.track?.id !== track.id) return;
      sessionRef.current = {
        sessionId: crypto.randomUUID(),
        trackId: track.id,
        track,
        duration: store.duration,
        startedAt: new Date().toISOString(),
        maxPositionReached: store.position,
      };
    }, CONFIRM_PLAY_MS);

    return () => clearTimeout(confirmTimerRef.current);
  }, [store.track?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keep the session's max-position updated as playback ticks ──
  useEffect(() => {
    if (sessionRef.current && sessionRef.current.trackId === store.track?.id) {
      sessionRef.current.maxPositionReached = Math.max(
        sessionRef.current.maxPositionReached,
        store.position
      );
      sessionRef.current.duration = store.duration;
    }
  }, [store.position, store.track?.id, store.duration]);

  // ── Finalize on unmount (e.g. navigating away, closing the app) ──
  useEffect(() => {
    return () => {
      if (sessionRef.current) finalizeSession(sessionRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load Spotify SDK script ──
  useEffect(() => {
    if (document.getElementById("spotify-sdk")) return;
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.head.appendChild(script);
  }, []);

  // ── Init SDK player ──
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
      });
      player.connect();
    };

    window.onSpotifyWebPlaybackSDKReady = initPlayer;
    if (window.Spotify) initPlayer();

    api.me().then((u) => {
      if (u) store.setUser(u);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const pollState = async () => {
    try {
      const data = await api.player() as any;
      if (!data || !data.item) return;

      // Skip updating if playing on the local Web SDK device to avoid race conditions
      if (store.deviceId && data.device?.id === store.deviceId) {
        return;
      }

      const item = data.item;
      store.setPlaybackState({
        track: {
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
        },
        isPlaying: data.is_playing,
        position: data.progress_ms,
        duration: item.duration_ms,
        shuffle: data.shuffle_state,
        repeat: data.repeat_state === "track" ? "track" : data.repeat_state === "context" ? "context" : "off",
      });
    } catch (e) {
      // Ignore fetch/empty-state errors
    }
  };

  // ── Polling playback state for external devices ──
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    pollState();
    const interval = setInterval(pollState, 4000);
    return () => {
      clearInterval(interval);
    };
  }, [store.deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync track saved/liked status ──
  useEffect(() => {
    if (!store.track?.id) return;

    // Check Spotify liked status
    api.isTrackLiked([store.track.id])
      .then((res) => {
        if (res && res.length > 0) {
          store.setIsLiked(res[0]);
        }
      })
      .catch((e) => console.error("Error checking Spotify like state:", e));
  }, [store.track?.id]); // eslint-disable-line react-hooks/exhaustive-deps



  // ── Fetch local liked songs on mount ──
  useEffect(() => {
    fetchLikedSongs().catch(() => {});
  }, [fetchLikedSongs]);

  // ── Position ticker ──
  useEffect(() => {
    clearInterval(positionTimer.current);
    if (store.isPlaying) {
      positionTimer.current = setInterval(() => {
        store.setPosition(Math.min(store.position + 1000, store.duration));
      }, 1000);
    }
    return () => clearInterval(positionTimer.current);
  }, [store.isPlaying, store.position, store.duration]);

  // ── Playback controls ──
  const togglePlay = async () => {
    try {
      if (store.isPlaying) {
        await api.pause();
        store.setPlaybackState({ isPlaying: false });
      } else {
        await api.play();
        store.setPlaybackState({ isPlaying: true });
      }
      setTimeout(pollState, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const skipNext = async () => {
    try {
      await api.next();
      setTimeout(pollState, 500);
      setTimeout(pollState, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const skipPrev = async () => {
    try {
      await api.prev();
      setTimeout(pollState, 500);
      setTimeout(pollState, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const seek = (ms: number) => {
    store.setPosition(ms);
    api.seek(ms).catch(() => {});
  };



  const toggleShuffle = async () => {
    const next = !store.shuffle;
    store.setPlaybackState({ shuffle: next });
    try {
      await api.shuffle(next);
      setTimeout(pollState, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const cycleRepeat = async () => {
    const next =
      REPEAT_CYCLE[
        (REPEAT_CYCLE.indexOf(store.repeat) + 1) % REPEAT_CYCLE.length
      ];
    store.setPlaybackState({ repeat: next });
    try {
      await api.repeat(next);
      setTimeout(pollState, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLike = async () => {
    if (!store.track?.id) return;
    const nextLiked = !store.isLiked;

    try {
      if (nextLiked) {
        await api.likeTrack(store.track.id);
        store.setIsLiked(true);
      } else {
        await api.unlikeTrack(store.track.id);
        store.setIsLiked(false);
      }

      // Synchronize to SociTune database
      const matchedLocalSong = likedSongs.find(
        (s: any) =>
          s.external_ids?.spotify_id === store.track?.id ||
          (s.title?.toLowerCase() === store.track?.name?.toLowerCase() &&
           s.artist?.toLowerCase() === fmt.artists(store.track?.artists)?.toLowerCase())
      );

      if (nextLiked && !matchedLocalSong) {
        await toggleLikeSong(store.track.id, {
          title: store.track.name,
          artist: fmt.artists(store.track.artists),
          imageUrl: store.track.album?.images?.[0]?.url || "",
          duration: store.duration / 1000,
        });
      } else if (!nextLiked && matchedLocalSong) {
        await toggleLikeSong(matchedLocalSong._id);
      }
    } catch (e) {
      console.error("Error in toggleLike:", e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 items-center p-6 bg-white/[0.01]">
      {/* Album art */}
      <AlbumArt track={store.track} size={220} className="shadow-2xl" />

      {/* Track info + like */}
      <div className="w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className={`font-sans font-extrabold truncate text-white leading-snug ${
              store.track ? "text-base" : "text-sm text-zinc-500"
            }`}>
              {store.track?.name ?? "Nothing playing"}
            </h2>
            {store.track && (
              <p className="text-xs text-zinc-400 truncate mt-1">
                {fmt.artists(store.track?.artists)}
              </p>
            )}
          </div>
          {store.track && (
            <button 
              onClick={toggleLike} 
              className="p-1 hover:bg-white/5 rounded-full transition-colors group/heart" 
              title="Like"
            >
              <Heart
                size={16}
                className={`transition-all duration-300 ${
                  store.isLiked 
                    ? "text-emerald-400 fill-emerald-400/20 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        position={store.position}
        duration={store.duration}
        onSeek={seek}
      />

      {/* Playback controls */}
      <div className="flex items-center gap-5 justify-center">
        <button 
          onClick={toggleShuffle} 
          className="p-1.5 hover:bg-white/5 rounded-full transition-all" 
          title="Shuffle"
        >
          <Shuffle 
            size={14} 
            className={`transition-colors ${store.shuffle ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "text-zinc-500 hover:text-zinc-300"}`} 
          />
        </button>

        <button 
          onClick={skipPrev} 
          className="p-1.5 hover:bg-white/5 rounded-full transition-all active:scale-95 text-zinc-400 hover:text-white" 
          title="Previous"
        >
          <SkipBack size={16} fill="currentColor" />
        </button>

        <button
          onClick={togglePlay}
          title={store.isPlaying ? "Pause" : "Play"}
          className="w-10 h-10 rounded-full bg-white hover:bg-white/90 text-black flex items-center justify-center flex-shrink-0 transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          {store.isPlaying ? (
            <Pause size={16} fill="black" />
          ) : (
            <Play size={16} fill="black" className="ml-0.5" />
          )}
        </button>

        <button 
          onClick={skipNext} 
          className="p-1.5 hover:bg-white/5 rounded-full transition-all active:scale-95 text-zinc-400 hover:text-white" 
          title="Next"
        >
          <SkipForward size={16} fill="currentColor" />
        </button>

        <button 
          onClick={cycleRepeat} 
          className="p-1.5 hover:bg-white/5 rounded-full transition-all" 
          title="Repeat"
        >
          <Repeat 
            size={14} 
            className={`transition-colors ${store.repeat !== "off" ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "text-zinc-500 hover:text-zinc-300"}`} 
          />
        </button>
      </div>


      {/* Active device indicator */}
      {store.deviceId && (
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase mt-2">
          <Laptop2 className="size-3 animate-pulse" />
          <span>Active Device</span>
        </div>
      )}
    </div>
  );
};

export default NowPlayingPanel;
