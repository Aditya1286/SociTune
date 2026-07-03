import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";
import { generateSongId } from "@/util/generateSongId";

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<string | null>(null);

  const { currentSong, isPlaying, playNext, isLooping } = usePlayerStore();

  const cumulativeTimeRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const hasFiredRef = useRef(false);
  const sessionIdRef = useRef("");
  const playedAtRef = useRef("");
  const currentSongIdRef = useRef<string | null>(null);

  const triggerLogPlay = async (isCompleted: boolean) => {
    if (!currentSong) return;
    try {
      const fuzzyId = currentSong.external_ids?.fuzzy_id || await generateSongId(currentSong.title, currentSong.artist);
      
      const path = window.location.pathname;
      let source: "organic" | "playlist" | "radio" | "search" | "recommendation" | "share" | "other" = "organic";
      if (path.startsWith("/search")) {
        source = "search";
      } else if (path.startsWith("/albums") || path.startsWith("/liked-songs")) {
        source = "playlist";
      } else if (path.startsWith("/time-travel")) {
        source = "recommendation";
      } else if (path.startsWith("/chat") || path.startsWith("/notifications")) {
        source = "share";
      } else if (path.startsWith("/radio")) {
        source = "radio";
      }

      const payload = {
        song_details: {
          title: currentSong.title,
          artist: currentSong.artist,
          external_ids: {
            isrc_id: currentSong.external_ids?.isrc_id,
            spotify_id: currentSong.external_ids?.spotify_id,
            yt_id: currentSong.external_ids?.yt_id,
            fuzzy_id: fuzzyId,
          },
          primary_genre: currentSong.genre || "unknown",
          duration: String(currentSong.duration),
          audio_details: currentSong.audio_details ? {
            tempo: currentSong.audio_details.tempo || 0,
            energy: currentSong.audio_details.energy || 0,
            valence: currentSong.audio_details.valence || 0,
            acousticness: currentSong.audio_details.acousticness || 0,
            danceability: currentSong.audio_details.danceability || 0,
          } : undefined,
          lyrics_details: currentSong.lyrics ? {
            lyrics: currentSong.lyrics,
            lyricsSource: currentSong.lyricsSource || "Unknown",
            lyricsFetchedAt: currentSong.lyricsFetchedAt ? new Date(currentSong.lyricsFetchedAt) : new Date(),
          } : undefined,
          image_url: currentSong.imageUrl,
        },
        played_at: playedAtRef.current,
        duration_ms: String(Math.round(cumulativeTimeRef.current)),
        completed: isCompleted || (cumulativeTimeRef.current >= (currentSong.duration * 1000) * 0.90),
        session_id: sessionIdRef.current,
        source,
      };

      const { logPlay } = usePlayerStore.getState();
      await logPlay(payload);
    } catch (err) {
      console.error("Error logging play from AudioPlayer:", err);
    }
  };

  const handleEnded = () => {
    const threshold = currentSong ? (currentSong.duration * 1000) / 3 : 30000;
    if (cumulativeTimeRef.current >= threshold && !hasFiredRef.current) {
      hasFiredRef.current = true;
      triggerLogPlay(true);
    }
    playNext();
  };

  // Cumulative play duration tracker
  useEffect(() => {
    if (!currentSong) {
      currentSongIdRef.current = null;
      cumulativeTimeRef.current = 0;
      hasFiredRef.current = false;
      return;
    }

    if (currentSongIdRef.current !== currentSong._id) {
      currentSongIdRef.current = currentSong._id;
      cumulativeTimeRef.current = 0;
      hasFiredRef.current = false;
      sessionIdRef.current = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      playedAtRef.current = new Date().toISOString();
    }

    if (!isPlaying) return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      cumulativeTimeRef.current += delta;

      const threshold = currentSong.duration ? (currentSong.duration * 1000) / 3 : 30000;
      if (cumulativeTimeRef.current >= threshold && !hasFiredRef.current) {
        hasFiredRef.current = true;
        triggerLogPlay(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [currentSong?._id, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
      const token = localStorage.getItem("spotify_access_token");
      if (token) {
        import("@/Features/SpotifyPlayer/services/spotifyApi").then(({ api }) => {
          api.pause().catch(() => {});
        });
      }
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    audio?.addEventListener("ended", handleEnded);
    return () => {
      audio?.removeEventListener("ended", handleEnded);
    };
  }, [playNext]);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    const audio = audioRef.current;
    const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
    if (isSongChange) {
      audio.src = currentSong?.audioUrl;
      audio.currentTime = 0;
      prevSongRef.current = currentSong?.audioUrl;
      if (isPlaying) audio.play();
    }
  }, [currentSong, isPlaying]);

  return <audio ref={audioRef} loop={isLooping} />;
};

export default AudioPlayer;