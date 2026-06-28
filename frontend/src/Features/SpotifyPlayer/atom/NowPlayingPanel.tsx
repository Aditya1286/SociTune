import { AlbumArt, ProgressBar, VolumeSlider, btnReset, fmt } from "./UI";
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipFwdIcon,
  ShuffleIcon,
  RepeatIcon,
  HeartIcon,
} from "./Icons";
import { useStore } from "../Index";
import { useEffect,useRef} from "react";
import { getStoredToken,getValidToken } from "../services/Auth";
import type { RepeatMode,WebPlaybackState } from "../Index";
import { api } from "../services/spotifyApi";
import { GREEN } from "./UI";


const REPEAT_CYCLE: RepeatMode[] = ["off", "context", "track"];

const NowPlayingPanel = () => {
  const store = useStore();
  const positionTimer = useRef<ReturnType<typeof setInterval>>(0);

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
        name: "SociTune",
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

        const track = state.track_window.current_track;
        const repeat = REPEAT_CYCLE[state.repeat_mode] ?? "off";

        store.setPlaybackState({
          track,
          isPlaying: !state.paused,
          position: state.position,
          duration: state.duration,
          shuffle: state.shuffle,
          repeat,
        });

        //This Api is Deprecated , Not check whether track is liked or not
        // if (track?.id) {
        //   api
        //     .isTrackLiked([track.id])
        //     .then((d) => store.setIsLiked(d?.[0] ?? false));
        // }
      });
      player.connect();
    };

    window.onSpotifyWebPlaybackSDKReady = initPlayer;
    if (window.Spotify) initPlayer();

    api.me().then((u) => {
      if (u) store.setUser(u);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  const togglePlay = () => store.player?.togglePlay();
  const skipNext = () => store.player?.nextTrack();
  const skipPrev = () => store.player?.previousTrack();

  const seek = (ms: number) => {
    store.setPosition(ms);
    api.seek(ms);
  };

  const setVolume = (v: number) => {
    store.setPlaybackState({ volume: v });
    store.player?.setVolume(v / 100);
    api.volume(v);
  };

  const toggleShuffle = () => {
    const next = !store.shuffle;
    store.setPlaybackState({ shuffle: next });
    api.shuffle(next);
  };

  const cycleRepeat = () => {
    const next =
      REPEAT_CYCLE[
        (REPEAT_CYCLE.indexOf(store.repeat) + 1) % REPEAT_CYCLE.length
      ];
    store.setPlaybackState({ repeat: next });
    api.repeat(next);
  };

  const toggleLike = async () => {
    if (!store.track?.id) return;
    if (store.isLiked) {
      await api.unlikeTrack(store.track.id);
      store.setIsLiked(false);
    } else {
      await api.likeTrack(store.track.id);
      store.setIsLiked(true);
    }
  };
  return (
    <div
      style={{
        width: 272,
        borderLeft: "1px solid #0f0f0f",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        alignItems: "center",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Album art */}
      <AlbumArt track={store.track} size={232} />

      {/* Track info + like */}
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: store.track
                  ? "DM Serif Display, serif"
                  : "Inter, sans-serif",
                fontSize: store.track ? 17 : 13,
                color: store.track ? "#fff" : "#2a2a2a",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {store.track?.name ?? "Nothing playing"}
            </div>
            {store.track && (
              <div
                style={{
                  fontSize: 12,
                  color: "#484848",
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt.artists(store.track?.artists)}
              </div>
            )}
          </div>
          <button onClick={toggleLike} style={btnReset} title="Like">
            <HeartIcon
              size={15}
              color={store.isLiked ? GREEN : "#2a2a2a"}
              filled={store.isLiked}
            />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        position={store.position}
        duration={store.duration}
        onSeek={seek}
      />

      {/* Playback controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button onClick={toggleShuffle} style={btnReset} title="Shuffle">
          <ShuffleIcon size={14} color={store.shuffle ? GREEN : "#2a2a2a"} />
        </button>
        <button onClick={skipPrev} style={btnReset} title="Previous">
          <SkipBackIcon size={17} color="#5a5a5a" />
        </button>
        <button
          onClick={togglePlay}
          title={store.isPlaying ? "Pause" : "Play"}
          style={{
            ...btnReset,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.05)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1)")
          }
        >
          {store.isPlaying ? (
            <PauseIcon size={15} color="#000" />
          ) : (
            <PlayIcon size={13} color="#000" />
          )}
        </button>
        <button onClick={skipNext} style={btnReset} title="Next">
          <SkipFwdIcon size={17} color="#5a5a5a" />
        </button>
        <button onClick={cycleRepeat} style={btnReset} title="Repeat">
          <RepeatIcon
            size={14}
            color={store.repeat !== "off" ? GREEN : "#2a2a2a"}
          />
        </button>
      </div>

      {/* Volume */}
      <VolumeSlider volume={store.volume} onChange={setVolume} />

      {/* Active device indicator */}
      {store.deviceId && (
        <div
          style={{
            fontSize: 10,
            color: "#1e1e1e",
            letterSpacing: "0.12em",
          }}
        >
          ● ACTIVE
        </div>
      )}
    </div>
  );
};

export default NowPlayingPanel;
